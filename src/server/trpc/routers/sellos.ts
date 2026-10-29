import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";
import { emitirSello, leerReglasSello } from "@/server/sello-engine/emitirService";
import { recolectarInputs } from "@/server/sello-engine/recolectar";

const protectedProcedure = publicProcedure.use(withTenant);
const asesorProcedure = protectedProcedure.use(
  requireRole("asesor", "admin_nucleo")
);

const scoresSchema = z.object({
  score_documentacion: z.number().min(0).max(100),
  score_condiciones: z.number().min(0).max(100),
  score_capacitaciones: z.number().min(0).max(100),
  score_tareas: z.number().min(0).max(100),
});

export const sellosRouter = router({
  getActual: protectedProcedure
    .input(z.object({ periodo: z.string().regex(/^\d{4}-\d{2}$/).optional() }))
    .query(async ({ ctx, input }) => {
      const periodo =
        input.periodo ??
        new Date().toISOString().slice(0, 7);

      return ctx.prisma.sello.findUnique({
        where: { tenant_id_periodo: { tenant_id: ctx.tenantActivo!, periodo } },
      });
    }),

  getHistorial: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(24).default(12) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.sello.findMany({
        where: { tenant_id: ctx.tenantActivo! },
        orderBy: { periodo: "desc" },
        take: input.limit,
      });
    }),

  propuesta: asesorProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        periodo: z.string().regex(/^\d{4}-\d{2}$/),
      })
    )
    .query(async ({ ctx, input }) => {
      await asegurarLocal(ctx, input.tenant_id);
      const [recolectado, reglas] = await Promise.all([
        recolectarInputs(ctx.prisma, input.tenant_id, input.periodo),
        leerReglasSello(ctx.prisma),
      ]);
      return {
        scores: {
          score_documentacion: recolectado.score_documentacion,
          score_condiciones: recolectado.score_condiciones,
          score_capacitaciones: recolectado.score_capacitaciones,
          score_tareas: recolectado.score_tareas,
        },
        hallazgos: recolectado.hallazgos,
        pesos: reglas.pesos,
        umbrales: reglas.umbrales,
      };
    }),

  emitir: asesorProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        periodo: z.string().regex(/^\d{4}-\d{2}$/),
        ...scoresSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await asegurarLocal(ctx, input.tenant_id);
      const recolectado = await recolectarInputs(ctx.prisma, input.tenant_id, input.periodo);
      const { sello } = await emitirSello({
        prisma: ctx.prisma,
        tenantId: input.tenant_id,
        periodo: input.periodo,
        scores: {
          score_documentacion: input.score_documentacion,
          score_condiciones: input.score_condiciones,
          score_capacitaciones: input.score_capacitaciones,
          score_tareas: input.score_tareas,
        },
        emitidoPor: ctx.userId!,
        inputsSnapshot: {
          scoresConfirmados: input,
          calculado: recolectado.detalle,
        },
        hallazgos: recolectado.hallazgos,
      });

      return sello;
    }),

  solicitarRevision: protectedProcedure
    .input(z.object({ sello_id: z.string().uuid(), motivo: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const sello = await ctx.prisma.sello.findUnique({
        where: { id: input.sello_id },
      });
      if (!sello || sello.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sello no encontrado." });
      }
      return ctx.prisma.revisionSello.create({
        data: {
          sello_id: input.sello_id,
          solicitado_por: ctx.userId!,
          motivo: input.motivo,
        },
      });
    }),

  /** Asesor/admin obtiene revisiones pendientes de un sello */
  getRevisiones: asesorProcedure
    .input(z.object({ sello_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const sello = await ctx.prisma.sello.findUnique({
        where: { id: input.sello_id },
        select: { tenant_id: true },
      });
      if (!sello) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sello no encontrado." });
      }
      await asegurarLocal(ctx, sello.tenant_id);
      return ctx.prisma.revisionSello.findMany({
        where: { sello_id: input.sello_id },
        include: {
          sello: { select: { tenant_id: true, periodo: true } },
        },
        orderBy: { created_at: "desc" },
      });
    }),

  /** Revisiones pendientes de todos los locales asignados al asesor */
  getRevisionesPendientes: asesorProcedure.query(async ({ ctx }) => {
    let tenantIds: string[];
    if (ctx.userRole === "admin_nucleo") {
      const ts = await ctx.prisma.tenant.findMany({ where: { estado: "activo" }, select: { id: true } });
      tenantIds = ts.map((t) => t.id);
    } else {
      const asig = await ctx.prisma.asignacionAsesor.findMany({
        where: { asesor_id: ctx.userId!, activo: true },
        select: { tenant_id: true },
      });
      tenantIds = asig.map((a) => a.tenant_id);
    }
    if (tenantIds.length === 0) return [];

    return ctx.prisma.revisionSello.findMany({
      where: {
        estado: "pendiente",
        sello: { tenant_id: { in: tenantIds } },
      },
      include: {
        sello: {
          select: {
            id: true,
            periodo: true,
            nivel: true,
            score_general: true,
            score_documentacion: true,
            score_condiciones: true,
            score_capacitaciones: true,
            score_tareas: true,
            tenant: { select: { nombre: true } },
          },
        },
      },
      orderBy: { created_at: "asc" },
    });
  }),

  /** Asesor responde (cierra) una revisión */
  resolverRevision: asesorProcedure
    .input(z.object({
      revision_id: z.string().uuid(),
      respuesta: z.string().min(5, "La respuesta debe tener al menos 5 caracteres"),
      corregir: scoresSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const revision = await ctx.prisma.revisionSello.findUnique({
        where: { id: input.revision_id },
        include: { sello: { select: { tenant_id: true, periodo: true } } },
      });
      if (!revision) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Revisión no encontrada." });
      }
      await asegurarLocal(ctx, revision.sello.tenant_id);

      if (input.corregir) {
        const recolectado = await recolectarInputs(
          ctx.prisma,
          revision.sello.tenant_id,
          revision.sello.periodo
        );
        await emitirSello({
          prisma: ctx.prisma,
          tenantId: revision.sello.tenant_id,
          periodo: revision.sello.periodo,
          scores: input.corregir,
          emitidoPor: ctx.userId!,
          inputsSnapshot: { revision_id: input.revision_id, calculado: recolectado.detalle },
          hallazgos: recolectado.hallazgos,
        });
      }

      return ctx.prisma.revisionSello.update({
        where: { id: input.revision_id },
        data: {
          respuesta: input.respuesta,
          estado: "resuelta",
        },
      });
    }),
});

async function asegurarLocal(
  ctx: { prisma: import("@prisma/client").PrismaClient; userId: string | null; userRole: string | null },
  tenantId: string
) {
  if (ctx.userRole === "admin_nucleo") return;
  const asignacion = await ctx.prisma.asignacionAsesor.findFirst({
    where: { asesor_id: ctx.userId ?? "", tenant_id: tenantId, activo: true },
    select: { id: true },
  });
  if (!asignacion) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Este local no está a tu cargo." });
  }
}
