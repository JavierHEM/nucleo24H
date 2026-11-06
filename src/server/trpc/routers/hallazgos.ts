import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireSuscripcionEscribible } from "@/server/middleware/suscripcion";
import {
  ESTADOS_EVIDENCIA,
  ESTADOS_HALLAZGO,
  GRAVEDADES,
  transicionHallazgo,
} from "@/lib/hallazgos/ciclo";
import { DECLARACIONES, DECLARACIONES_VERSION } from "@/lib/declaraciones/textos";
import { esStaffNucleo } from "@/lib/comunicaciones/tickets";
import { sonRutasHallazgoDelLocal } from "@/lib/storage/rutas";
import { constanciasDeRecurso } from "@/server/declaraciones/deRecurso";

const protectedProcedure = publicProcedure.use(withTenant);
const writeProcedure = protectedProcedure.use(requireSuscripcionEscribible);

export const hallazgosRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        estado: z.string().optional(),
        gravedad: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.hallazgo.findMany({
        where: {
          tenant_id: ctx.tenantActivo!,
          ...(input.estado ? { estado: input.estado } : {}),
          ...(input.gravedad ? { gravedad: input.gravedad } : {}),
        },
        orderBy: { created_at: "desc" },
        take: input.limit,
        include: {
          proveedor: { select: { id: true, razon_social: true } },
          visita: { select: { id: true, fecha: true, tipo: true, motivo: true, estado: true } },
        },
      });
    }),

  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const hallazgo = await ctx.prisma.hallazgo.findUnique({
      where: { id: input.id },
      include: {
        eventos: { orderBy: { created_at: "asc" } },
        proveedor: true,
        visita: { select: { id: true, fecha: true, tipo: true, motivo: true, estado: true } },
        visitas_por_origen: {
          where: { estado: { in: ["agendada", "realizada"] } },
          orderBy: { fecha: "desc" },
          select: { id: true, fecha: true, tipo: true, motivo: true, estado: true },
        },
      },
    });
    if (!hallazgo || hallazgo.tenant_id !== ctx.tenantActivo) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hallazgo no encontrado." });
    }
    const declaraciones = await constanciasDeRecurso(
      ctx.prisma,
      ctx.tenantActivo!,
      "hallazgo",
      hallazgo.id
    );
    return { ...hallazgo, declaraciones, rol: ctx.userRole };
  }),

  crear: writeProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid().optional(),
        visita_id: z.string().uuid().optional(),
        proveedor_id: z.string().uuid().optional(),
        gravedad: z.enum(GRAVEDADES),
        descripcion: z.string().min(8).max(2000),
        fundamento: z.string().max(2000).optional(),
        ubicacion: z.string().max(200).optional(),
        plazo: z.string().datetime().optional(),
        fotos_iniciales: z.array(z.string()).max(8).optional(),
        responsable_id: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = input.tenant_id ?? ctx.tenantActivo!;
      if (input.fotos_iniciales?.length && !sonRutasHallazgoDelLocal(input.fotos_iniciales, tenantId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Las fotos del hallazgo deben subirse desde la plataforma.",
        });
      }
      if (input.visita_id) {
        const visita = await ctx.prisma.visita.findFirst({
          where: { id: input.visita_id, tenant_id: tenantId, estado: { not: "cancelada" } },
          select: { id: true },
        });
        if (!visita) {
          throw new TRPCError({ code: "NOT_FOUND", message: "La visita no existe en este local." });
        }
      }
      const hallazgo = await ctx.prisma.hallazgo.create({
        data: {
          tenant_id: tenantId,
          visita_id: input.visita_id,
          proveedor_id: input.proveedor_id,
          gravedad: input.gravedad,
          descripcion: input.descripcion,
          fundamento: input.fundamento,
          ubicacion: input.ubicacion,
          observador_id: ctx.userId!,
          responsable_id: input.responsable_id,
          plazo: input.plazo ? new Date(input.plazo) : null,
          fotos_iniciales: input.fotos_iniciales ?? [],
        },
      });
      await ctx.prisma.hallazgoEvento.create({
        data: {
          hallazgo_id: hallazgo.id,
          actor_id: ctx.userId!,
          a_estado: "abierto",
          nota: input.visita_id ? "Apertura desde visita" : "Apertura",
        },
      });
      return hallazgo;
    }),

  vinculables: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.hallazgo.findMany({
      where: {
        tenant_id: ctx.tenantActivo!,
        estado: { notIn: ["cerrado_validado", "seguimiento_eficacia"] },
      },
      orderBy: { created_at: "desc" },
      take: 80,
      select: { id: true, descripcion: true, gravedad: true, estado: true },
    });
  }),

  transicionar: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        destino: z.enum(ESTADOS_HALLAZGO),
        nota: z.string().max(1000).optional(),
        contencion: z.string().max(2000).optional(),
        accion_correctiva: z.string().max(2000).optional(),
        evidencia_cierre: z.array(z.string()).max(8).optional(),
        evidencia_estado: z.enum(ESTADOS_EVIDENCIA).optional(),
        acepta_declaracion_c: z.boolean().optional(),
        seguimiento_resultado: z.string().max(2000).optional(),
        motivo_decision: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hallazgo = await ctx.prisma.hallazgo.findUnique({ where: { id: input.id } });
      if (!hallazgo || hallazgo.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hallazgo no encontrado." });
      }
      if (!transicionHallazgo(hallazgo.estado, input.destino, ctx.userRole ?? "")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ese cambio de estado no está permitido." });
      }
      if (
        input.evidencia_cierre?.length &&
        !sonRutasHallazgoDelLocal(input.evidencia_cierre, hallazgo.tenant_id)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La evidencia de cierre debe subirse desde la plataforma.",
        });
      }
      if (input.destino === "evidencia_en_revision" && !esStaffNucleo(ctx.userRole)) {
        if (!input.acepta_declaracion_c) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Debes aceptar la declaración de veracidad para informar el cierre.",
          });
        }
        await ctx.prisma.declaracionVeracidad.create({
          data: {
            tenant_id: ctx.tenantActivo!,
            user_id: ctx.userId!,
            tipo: "C",
            version: DECLARACIONES_VERSION,
            texto: DECLARACIONES.C.texto,
            evento: "solicitar_cierre_hallazgo",
            recurso_tipo: "hallazgo",
            recurso_id: hallazgo.id,
          },
        });
      }
      const staff = esStaffNucleo(ctx.userRole);
      return ctx.prisma.hallazgo.update({
        where: { id: hallazgo.id },
        data: {
          estado: input.destino,
          contencion: input.contencion ?? hallazgo.contencion,
          accion_correctiva: input.accion_correctiva ?? hallazgo.accion_correctiva,
          evidencia_cierre: input.evidencia_cierre ?? hallazgo.evidencia_cierre,
          evidencia_estado:
            staff && input.evidencia_estado ? input.evidencia_estado : hallazgo.evidencia_estado,
          seguimiento_resultado: input.seguimiento_resultado ?? hallazgo.seguimiento_resultado,
          motivo_decision: input.motivo_decision ?? hallazgo.motivo_decision,
          ...(staff && input.destino === "cerrado_validado"
            ? { revisor_id: ctx.userId, revision_at: new Date(), decision: "cerrar" }
            : {}),
          eventos: {
            create: {
              actor_id: ctx.userId!,
              de_estado: hallazgo.estado,
              a_estado: input.destino,
              nota: input.nota,
            },
          },
        },
      });
    }),

  marcarEvidencia: writeProcedure
    .input(z.object({ id: z.string().uuid(), evidencia_estado: z.enum(ESTADOS_EVIDENCIA) }))
    .mutation(async ({ ctx, input }) => {
      if (!esStaffNucleo(ctx.userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo el profesional puede cambiar el estado de evidencia. Aceptar una declaración no lo modifica.",
        });
      }
      const hallazgo = await ctx.prisma.hallazgo.findUnique({ where: { id: input.id } });
      if (!hallazgo || hallazgo.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hallazgo no encontrado." });
      }
      if (input.evidencia_estado === "verificado_visita" && !hallazgo.visita_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verificado en visita solo aplica si el hallazgo tiene una visita registrada.",
        });
      }
      return ctx.prisma.hallazgo.update({
        where: { id: hallazgo.id },
        data: { evidencia_estado: input.evidencia_estado },
      });
    }),
});
