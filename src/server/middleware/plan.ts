import { TRPCError } from "@trpc/server";
import { t } from "@/server/trpc/trpc";
import { etiquetaPlan, planIncluye, PLANES, type ModuloPlan } from "@/lib/planes";
import { planDeLocal } from "@/server/planes/planDeLocal";

const PLAN_CON_MODULO = (modulo: ModuloPlan) =>
  Object.values(PLANES).find((plan) => plan.modulos.includes(modulo))?.nombre ?? "otro plan";

export const requireModulo = (modulo: ModuloPlan) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.tenantActivo) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No hay un local activo seleccionado." });
    }
    const info = await planDeLocal(ctx.prisma, ctx.tenantActivo);
    if (!planIncluye(info.plan, modulo)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Esta función está incluida en el ${PLAN_CON_MODULO(modulo)}. Tu local tiene el ${etiquetaPlan(info.plan)}.`,
      });
    }
    return next({ ctx: { ...ctx, planLocal: info } });
  });
