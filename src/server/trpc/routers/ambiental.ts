import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAdmin, requireAsesor } from "@/server/middleware/rbac";
import { requireModulo } from "@/server/middleware/plan";
import { cicloContrato, DECLARACIONES_VU_ANUALES } from "@/lib/planes";
import { contarDeclaraciones, registroAmbientalSchema, vencimientosProximos } from "@/lib/ambiental";

const lecturaProcedure = publicProcedure.use(withTenant).use(requireAdmin).use(requireModulo("ambiental"));
const escrituraProcedure = publicProcedure.use(withTenant).use(requireAsesor).use(requireModulo("ambiental"));

export const ambientalRouter = router({
  resumen: lecturaProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantActivo!;
    const ahora = new Date();
    const ciclo = cicloContrato(ctx.planLocal.contratoDesde, ahora);

    const registros = await ctx.prisma.gestionAmbiental.findMany({
      where: { tenant_id: tenantId },
      orderBy: { fecha: "desc" },
      take: 200,
    });

    return {
      ciclo,
      declaraciones: contarDeclaraciones(registros, ciclo),
      limiteDeclaraciones: DECLARACIONES_VU_ANUALES,
      registros,
      vencimientos: vencimientosProximos(registros, ahora),
    };
  }),

  registrar: escrituraProcedure.input(registroAmbientalSchema).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.tenantActivo!;
    const fecha = new Date(input.fecha);

    if (input.tipo === "ventanilla_unica") {
      const ciclo = cicloContrato(ctx.planLocal.contratoDesde, fecha);
      const usadas = await ctx.prisma.gestionAmbiental.count({
        where: { tenant_id: tenantId, tipo: "ventanilla_unica", fecha: { gte: ciclo.inicio, lt: ciclo.fin } },
      });
      if (usadas >= DECLARACIONES_VU_ANUALES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `El plan incluye hasta ${DECLARACIONES_VU_ANUALES} declaraciones al año y este local ya las usó.`,
        });
      }
    }

    return ctx.prisma.gestionAmbiental.create({
      data: {
        tenant_id: tenantId,
        tipo: input.tipo,
        fecha,
        detalle: input.detalle,
        folio: input.folio || null,
        vence: input.vence ? new Date(input.vence) : null,
        created_by: ctx.userId!,
      },
    });
  }),

  eliminar: escrituraProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const registro = await ctx.prisma.gestionAmbiental.findUnique({
      where: { id: input.id },
      select: { tenant_id: true },
    });
    if (!registro || registro.tenant_id !== ctx.tenantActivo) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Registro no encontrado." });
    }
    await ctx.prisma.gestionAmbiental.delete({ where: { id: input.id } });
    return { ok: true };
  }),
});
