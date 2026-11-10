import { finDeContrato, PLAN_PRECIOS_CLP, type PlanId } from "@/lib/planes";

export function altaSuscripcionLocal(args: {
  plan: PlanId;
  diaCobro?: number;
  ahora?: Date;
}) {
  const desde = args.ahora ?? new Date();
  return {
    plan: args.plan,
    monto_clp: PLAN_PRECIOS_CLP[args.plan],
    dia_cobro: args.diaCobro ?? 5,
    estado: "activa" as const,
    desde,
    hasta: finDeContrato(desde),
  };
}
