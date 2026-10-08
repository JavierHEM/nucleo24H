import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { getPlanilla, schemaDePlanilla, textoAvisoPlanillaPapel } from "@/lib/bpm/planillas";
import { puedeOperarLocal } from "@/lib/roles";
import { sendAvisoPlanillaPapel } from "@/lib/email/sendPlanillaPapel";
import { crearUrlDeLectura } from "@/lib/storage/archivos";
import { rutaPertenece } from "@/lib/storage/rutas";
import { env } from "@/lib/env";

const protectedProcedure = publicProcedure.use(withTenant);

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

  crear: protectedProcedure
    .input(
      z.object({
        codigo: z.string(),
        fecha: z.string().datetime(),
        datos: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const planilla = getPlanilla(input.codigo);
      if (!planilla) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Planilla no reconocida." });
      }

      const parsed = schemaDePlanilla(planilla).safeParse(input.datos);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: parsed.error.issues[0]?.message ?? "Revisa los datos del registro.",
        });
      }

      return ctx.prisma.registro.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          tipo: planilla.familia,
          codigo: planilla.codigo,
          origen: "digital",
          fecha: new Date(input.fecha),
          datos: parsed.data as Prisma.InputJsonValue,
          created_by: ctx.userId!,
        },
      });
    }),

  cargarPapel: protectedProcedure
    .input(
      z.object({
        codigo: z.string(),
        fecha: z.string().datetime(),
        adjunto_url: z.string().min(1).max(500),
        nota: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!puedeOperarLocal(ctx.userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo el jefe o el admin del local pueden cargar una planilla impresa.",
        });
      }

      const planilla = getPlanilla(input.codigo);
      if (!planilla) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Planilla no reconocida." });
      }
      if (!rutaPertenece(input.adjunto_url, "registros", ctx.tenantActivo!)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El archivo no corresponde a este local.",
        });
      }

      const registro = await ctx.prisma.registro.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          tipo: planilla.familia,
          codigo: planilla.codigo,
          origen: "papel",
          estado: "pendiente",
          fecha: new Date(input.fecha),
          adjunto_url: input.adjunto_url,
          datos: { nota: input.nota ?? "" } as Prisma.InputJsonValue,
          created_by: ctx.userId!,
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
});
