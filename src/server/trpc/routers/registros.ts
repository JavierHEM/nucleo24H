import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { getPlanilla, schemaDePlanilla, textoAvisoPlanillaPapel } from "@/lib/bpm/planillas";
import { programaResuelto } from "@/lib/bpm/programa";
import { puedeCargarPlanilla } from "@/lib/roles";
import { sendAvisoPlanillaPapel } from "@/lib/email/sendPlanillaPapel";
import { crearUrlDeLectura } from "@/lib/storage/archivos";
import { rutaPertenece } from "@/lib/storage/rutas";
import { env } from "@/lib/env";
import { DECLARACIONES, DECLARACIONES_VERSION } from "@/lib/declaraciones/textos";
import { requireSuscripcionEscribible } from "@/server/middleware/suscripcion";
import { requireRole } from "@/server/middleware/rbac";
import { ESTADOS_EVIDENCIA } from "@/lib/hallazgos/ciclo";

const protectedProcedure = publicProcedure.use(withTenant);
const writeProcedure = protectedProcedure.use(requireSuscripcionEscribible);
const staffProcedure = protectedProcedure.use(requireRole("asesor", "admin_nucleo"));

const equipoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  limite_min: z.number().nullable().optional(),
  limite_max: z.number().nullable().optional(),
});

const areaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  producto: z.string().optional(),
  frecuencia: z.string().optional(),
});

async function planillaActiva(
  prisma: typeof import("@/server/db/prisma").prisma,
  tenantId: string,
  codigo: string
) {
  const planilla = getPlanilla(codigo);
  if (!planilla) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Planilla no reconocida." });
  }
  const config = await prisma.configuracionBpm.findUnique({
    where: { tenant_id: tenantId },
    select: { programa: true },
  });
  const activa = programaResuelto(config?.programa ?? null).some(
    (item) => item.codigo === codigo && item.activa
  );
  if (!activa) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Esta planilla no aplica a este local.",
    });
  }
  return planilla;
}

function whereTipo(tipo?: string) {
  if (!tipo) return {};
  if (tipo === "almacenamiento") return { tipo: { in: ["almacenamiento", "temperatura"] } };
  return { tipo };
}

export const registrosRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        tipo: z.string().optional(),
        desde: z.string().datetime().optional(),
        hasta: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.registro.findMany({
        where: {
          tenant_id: ctx.tenantActivo!,
          ...whereTipo(input.tipo),
          ...(input.desde || input.hasta
            ? {
                fecha: {
                  ...(input.desde ? { gte: new Date(input.desde) } : {}),
                  ...(input.hasta ? { lte: new Date(input.hasta) } : {}),
                },
              }
            : {}),
        },
        orderBy: { fecha: "desc" },
        take: input.limit,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
    }),

  contexto: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.prisma.configuracionBpm.findUnique({
      where: { tenant_id: ctx.tenantActivo! },
      select: { equipos_frio: true, areas_limpieza: true },
    });
    return {
      equipos: z.array(equipoSchema).catch([]).parse(config?.equipos_frio ?? []),
      areas: z.array(areaSchema).catch([]).parse(config?.areas_limpieza ?? []),
    };
  }),

  crear: writeProcedure
    .input(
      z.object({
        codigo: z.string(),
        fecha: z.string().datetime(),
        datos: z.record(z.string(), z.unknown()),
        acepta_declaracion_a: z.literal(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const planilla = await planillaActiva(ctx.prisma, ctx.tenantActivo!, input.codigo);

      const parsed = schemaDePlanilla(planilla).safeParse(input.datos);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: parsed.error.issues[0]?.message ?? "Revisa los datos del registro.",
        });
      }

      const fecha = new Date(input.fecha);
      const creado = new Date();
      const extemporaneo =
        fecha.toISOString().slice(0, 10) !== creado.toISOString().slice(0, 10);

      const registro = await ctx.prisma.registro.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          tipo: planilla.familia,
          codigo: planilla.codigo,
          origen: "digital",
          fecha,
          datos: parsed.data as Prisma.InputJsonValue,
          evidencia_estado: "declarado_cliente",
          extemporaneo,
          created_by: ctx.userId!,
        },
      });
      await ctx.prisma.declaracionVeracidad.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          user_id: ctx.userId!,
          tipo: "A",
          version: DECLARACIONES_VERSION,
          texto: DECLARACIONES.A.texto,
          evento: "completar_registro",
          recurso_tipo: "registro",
          recurso_id: registro.id,
        },
      });
      return registro;
    }),

  cargarPapel: writeProcedure
    .input(
      z.object({
        codigo: z.string(),
        fecha: z.string().datetime(),
        adjunto_url: z.string().min(1).max(500),
        nota: z.string().trim().max(500).optional(),
        acepta_declaracion_a: z.literal(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!puedeCargarPlanilla(ctx.userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo el equipo del local puede cargar una planilla impresa.",
        });
      }

      const planilla = await planillaActiva(ctx.prisma, ctx.tenantActivo!, input.codigo);
      if (!rutaPertenece(input.adjunto_url, "registros", ctx.tenantActivo!)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El archivo no corresponde a este local.",
        });
      }

      const fecha = new Date(input.fecha);
      const registro = await ctx.prisma.registro.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          tipo: planilla.familia,
          codigo: planilla.codigo,
          origen: "papel",
          estado: "pendiente",
          fecha,
          adjunto_url: input.adjunto_url,
          datos: { nota: input.nota ?? "" } as Prisma.InputJsonValue,
          evidencia_estado: "declarado_cliente",
          created_by: ctx.userId!,
        },
      });
      await ctx.prisma.declaracionVeracidad.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          user_id: ctx.userId!,
          tipo: "A",
          version: DECLARACIONES_VERSION,
          texto: DECLARACIONES.A.texto,
          evento: "cargar_planilla_papel",
          recurso_tipo: "registro",
          recurso_id: registro.id,
        },
      });

      const asignaciones = await ctx.prisma.asignacionAsesor.findMany({
        where: { tenant_id: ctx.tenantActivo!, activo: true },
        select: { asesor_id: true },
      });
      const asesorIds = [...new Set(asignaciones.map((a) => a.asesor_id))].filter(
        (id) => id !== ctx.userId
      );

      if (asesorIds.length === 0) {
        return { id: registro.id, asesoresNotificados: 0 };
      }

      const contenido = textoAvisoPlanillaPapel(planilla.codigo, planilla.nombre);
      await ctx.prisma.mensaje.createMany({
        data: asesorIds.map((asesorId) => ({
          tenant_id: ctx.tenantActivo!,
          de: ctx.userId!,
          para: asesorId,
          contenido,
          adjunto_url: input.adjunto_url,
        })),
      });

      const [asesores, local] = await Promise.all([
        ctx.prisma.user.findMany({
          where: { id: { in: asesorIds }, activo: true },
          select: { email: true },
        }),
        ctx.prisma.tenant.findUnique({
          where: { id: ctx.tenantActivo! },
          select: { nombre: true },
        }),
      ]);

      const archivoUrl =
        (await crearUrlDeLectura(input.adjunto_url, 60 * 60 * 24)) ??
        `${env.NEXT_PUBLIC_APP_URL}/registros`;

      await Promise.all(
        asesores
          .filter((asesor) => asesor.email)
          .map((asesor) =>
            sendAvisoPlanillaPapel({
              to: asesor.email,
              nombreLocal: local?.nombre ?? "el local",
              codigo: planilla.codigo,
              nombrePlanilla: planilla.nombre,
              archivoUrl,
            }).catch((error: unknown) => {
              console.error("[cargarPapel] No se pudo enviar el correo al asesor:", error);
            })
          )
      );

      return { id: registro.id, asesoresNotificados: asesorIds.length };
    }),

  corregir: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        datos: z.record(z.string(), z.unknown()),
        motivo: z.string().trim().min(5).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const registro = await ctx.prisma.registro.findUnique({ where: { id: input.id } });
      if (!registro || registro.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro no encontrado." });
      }
      await ctx.prisma.registroEdicion.create({
        data: {
          registro_id: registro.id,
          actor_id: ctx.userId!,
          motivo: input.motivo,
          datos_antes: registro.datos as Prisma.InputJsonValue,
        },
      });
      return ctx.prisma.registro.update({
        where: { id: registro.id },
        data: { datos: input.datos as Prisma.InputJsonValue },
      });
    }),

  marcarEvidencia: staffProcedure
    .input(z.object({ id: z.string().uuid(), evidencia_estado: z.enum(ESTADOS_EVIDENCIA) }))
    .mutation(async ({ ctx, input }) => {
      const registro = await ctx.prisma.registro.findUnique({ where: { id: input.id } });
      if (!registro || registro.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro no encontrado." });
      }
      return ctx.prisma.registro.update({
        where: { id: registro.id },
        data: { evidencia_estado: input.evidencia_estado },
      });
    }),
});
