import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAdmin, requireAsesor } from "@/server/middleware/rbac";
import { puedeOperarLocal } from "@/lib/roles";
import {
  ESTADOS_DESCARGO,
  fiscalizacionSchema,
  solicitudDescargoSchema,
  textoAvisoDescargo,
  textoRespuestaDescargo,
  transicionDescargoValida,
  esEstadoDescargo,
} from "@/lib/descargos";
import { rutaPertenece } from "@/lib/storage/rutas";
import { sendAvisoDescargo } from "@/lib/email/sendDescargo";
import { env } from "@/lib/env";
import type { TRPCContext } from "@/server/trpc/context";
import { elegibilidadDeLocal } from "@/server/descargos/elegibilidad";

const procedure = publicProcedure.use(withTenant).use(requireAdmin);
const asesorProcedure = publicProcedure.use(withTenant).use(requireAsesor);

type Ctx = Pick<TRPCContext, "prisma" | "tenantActivo" | "userId" | "userRole">;

function validarAdjuntos(rutas: readonly string[], tenantId: string) {
  if (!rutas.every((ruta) => rutaPertenece(ruta, "documentos", tenantId))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Alguno de los archivos no corresponde a este local." });
  }
}

async function exigirAsesorAsignado(ctx: Ctx) {
  if (ctx.userRole !== "asesor") return;
  const asignacion = await ctx.prisma.asignacionAsesor.findFirst({
    where: { tenant_id: ctx.tenantActivo!, asesor_id: ctx.userId!, activo: true },
    select: { id: true },
  });
  if (!asignacion) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes asignado este local." });
  }
}

export const fiscalizacionesRouter = router({
  resumen: procedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantActivo!;
    const [elegibilidad, fiscalizaciones, descargos] = await Promise.all([
      elegibilidadDeLocal(ctx.prisma, tenantId),
      ctx.prisma.fiscalizacion.findMany({ where: { tenant_id: tenantId }, orderBy: { fecha: "desc" }, take: 50 }),
      ctx.prisma.descargo.findMany({ where: { tenant_id: tenantId }, orderBy: { created_at: "desc" }, take: 50 }),
    ]);

    const usuarioIds = [...new Set(descargos.flatMap((d) => [d.solicitado_por, d.atendido_por].filter(Boolean) as string[]))];
    const usuarios = usuarioIds.length
      ? await ctx.prisma.user.findMany({ where: { id: { in: usuarioIds } }, select: { id: true, nombre: true } })
      : [];
    const nombres = new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre]));

    return {
      elegibilidad,
      fiscalizaciones,
      descargos: descargos.map((descargo) => ({
        ...descargo,
        solicitanteNombre: nombres.get(descargo.solicitado_por) ?? null,
        asesorNombre: descargo.atendido_por ? (nombres.get(descargo.atendido_por) ?? null) : null,
      })),
    };
  }),

  registrarFiscalizacion: procedure.input(fiscalizacionSchema).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.tenantActivo!;
    if (input.acta_url) {
      if (!puedeOperarLocal(ctx.userRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo el equipo del local puede adjuntar el acta." });
      }
      validarAdjuntos([input.acta_url], tenantId);
    }
    await exigirAsesorAsignado(ctx);

    return ctx.prisma.fiscalizacion.create({
      data: {
        tenant_id: tenantId,
        fecha: new Date(input.fecha),
        autoridad: input.autoridad,
        resultado: input.resultado,
        detalle: input.detalle || null,
        acta_url: input.acta_url ?? null,
        created_by: ctx.userId!,
      },
    });
  }),

  solicitarDescargo: procedure.input(solicitudDescargoSchema).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.tenantActivo!;
    const elegibilidad = await elegibilidadDeLocal(ctx.prisma, tenantId);
    if (!elegibilidad.habilitado) {
      throw new TRPCError({ code: "FORBIDDEN", message: elegibilidad.motivo ?? "Los descargos requieren sello Premium." });
    }
    await exigirAsesorAsignado(ctx);

    if (input.adjuntos.length > 0) {
      if (!puedeOperarLocal(ctx.userRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo el equipo del local puede adjuntar archivos." });
      }
      validarAdjuntos(input.adjuntos, tenantId);
    }

    if (input.fiscalizacion_id) {
      const fiscalizacion = await ctx.prisma.fiscalizacion.findUnique({
        where: { id: input.fiscalizacion_id },
        select: { tenant_id: true },
      });
      if (!fiscalizacion || fiscalizacion.tenant_id !== tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos esa fiscalización." });
      }
    }

    const descargo = await ctx.prisma.descargo.create({
      data: {
        tenant_id: tenantId,
        fiscalizacion_id: input.fiscalizacion_id ?? null,
        titulo: input.titulo,
        descripcion: input.descripcion,
        adjuntos: input.adjuntos,
        solicitado_por: ctx.userId!,
      },
    });

    const asignaciones = await ctx.prisma.asignacionAsesor.findMany({
      where: { tenant_id: tenantId, activo: true },
      select: { asesor_id: true },
    });
    const asesorIds = [...new Set(asignaciones.map((a) => a.asesor_id))].filter((id) => id !== ctx.userId);

    if (asesorIds.length > 0) {
      await ctx.prisma.mensaje.createMany({
        data: asesorIds.map((asesorId) => ({
          tenant_id: tenantId,
          de: ctx.userId!,
          para: asesorId,
          contenido: textoAvisoDescargo(input.titulo),
        })),
      });

      const [asesores, local] = await Promise.all([
        ctx.prisma.user.findMany({ where: { id: { in: asesorIds }, activo: true }, select: { email: true } }),
        ctx.prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombre: true } }),
      ]);
      await Promise.all(
        asesores
          .filter((asesor) => asesor.email)
          .map((asesor) =>
            sendAvisoDescargo({
              to: asesor.email,
              nombreLocal: local?.nombre ?? "Un local",
              titulo: input.titulo,
              url: `${env.NEXT_PUBLIC_APP_URL}/fiscalizaciones`,
            }).catch((error: unknown) => {
              console.error("[solicitarDescargo] No se pudo enviar el correo al asesor:", error, { descargoId: descargo.id });
            })
          )
      );
    }

    return { id: descargo.id, asesoresNotificados: asesorIds.length };
  }),

  actualizarDescargo: asesorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        estado: z.enum(ESTADOS_DESCARGO),
        respuesta: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await exigirAsesorAsignado(ctx);
      const descargo = await ctx.prisma.descargo.findUnique({ where: { id: input.id } });
      if (!descargo || descargo.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos esa solicitud." });
      }
      const actual = esEstadoDescargo(descargo.estado) ? descargo.estado : "abierto";
      const cambiaEstado = input.estado !== actual;
      if (cambiaEstado && !transicionDescargoValida(actual, input.estado)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta solicitud no puede volver a un estado anterior." });
      }
      if (actual === "cerrado") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La solicitud ya está cerrada." });
      }

      const ahora = new Date();
      const actualizado = await ctx.prisma.descargo.update({
        where: { id: input.id },
        data: {
          estado: input.estado,
          respuesta: input.respuesta || descargo.respuesta,
          atendido_por: ctx.userId!,
          presentado_at: input.estado === "presentado" && !descargo.presentado_at ? ahora : undefined,
          cerrado_at: input.estado === "cerrado" ? ahora : undefined,
        },
      });

      if (cambiaEstado && descargo.solicitado_por !== ctx.userId) {
        await ctx.prisma.mensaje.create({
          data: {
            tenant_id: descargo.tenant_id,
            de: ctx.userId!,
            para: descargo.solicitado_por,
            contenido: textoRespuestaDescargo(descargo.titulo, input.estado),
          },
        });
      }

      return actualizado;
    }),
});
