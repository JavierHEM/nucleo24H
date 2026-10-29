import { PLAN_IDS, PLAN_PRECIOS_CLP, normalizarPlan, type PlanId } from "@/lib/planes";

export type LocalConPlan = { plan: unknown; monto: number | null | undefined };

export type ResumenPlan = { locales: number; ingresoMensual: number };

export function agruparPorPlan(locales: readonly LocalConPlan[]): Record<PlanId, ResumenPlan> {
  const resumen = Object.fromEntries(PLAN_IDS.map((id) => [id, { locales: 0, ingresoMensual: 0 }])) as Record<
    PlanId,
    ResumenPlan
  >;
  for (const local of locales) {
    const plan = normalizarPlan(local.plan);
    resumen[plan].locales += 1;
    resumen[plan].ingresoMensual += local.monto ?? PLAN_PRECIOS_CLP[plan];
  }
  return resumen;
}
