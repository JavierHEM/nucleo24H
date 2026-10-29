import type { prisma as prismaClient } from "@/server/db/prisma";
import { normalizarPlan, normalizarTipoLocal, type PlanId, type TipoLocal } from "@/lib/planes";

type Db = typeof prismaClient;

export type PlanDeLocal = {
  plan: PlanId;
  tipoLocal: TipoLocal;
  contratoDesde: Date | null;
  contratoHasta: Date | null;
  estadoSuscripcion: string | null;
  montoMensual: number | null;
  diaCobro: number | null;
};

export async function planDeLocal(db: Db, tenantId: string): Promise<PlanDeLocal> {
  const [tenant, suscripcion] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, tipo_local: true } }),
    db.suscripcion.findUnique({
      where: { tenant_id: tenantId },
      select: { plan: true, desde: true, hasta: true, estado: true, monto_clp: true, dia_cobro: true },
    }),
  ]);

  return {
    plan: normalizarPlan(suscripcion?.plan ?? tenant?.plan),
    tipoLocal: normalizarTipoLocal(tenant?.tipo_local),
    contratoDesde: suscripcion?.desde ?? null,
    contratoHasta: suscripcion?.hasta ?? null,
    estadoSuscripcion: suscripcion?.estado ?? null,
    montoMensual: suscripcion?.monto_clp ?? null,
    diaCobro: suscripcion?.dia_cobro ?? null,
  };
}
