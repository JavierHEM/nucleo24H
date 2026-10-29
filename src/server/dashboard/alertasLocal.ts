import type { PrismaClient } from "@prisma/client";
import { armarAlertasLocal, type AlertaLocal } from "@/lib/alertasLocal";
import { planIncluye } from "@/lib/planes";
import { planDeLocal } from "@/server/planes/planDeLocal";
import { getCurrentPeriodo } from "@/lib/utils";

export async function cargarAlertasLocal(
  prisma: PrismaClient,
  tenantId: string,
  verPagos: boolean
): Promise<AlertaLocal[]> {
  const info = await planDeLocal(prisma, tenantId);
  const conAmbiental = planIncluye(info.plan, "ambiental");

  const [documentos, noConformidades, pagoPeriodo, ambiental, suscripcion] = await Promise.all([
    prisma.documento.findMany({
      where: { tenant_id: tenantId },
      select: { estado: true, vencimiento: true },
    }),
    prisma.noConformidad.findMany({
      where: { visita: { tenant_id: tenantId }, estado: { not: "cerrada" } },
      select: { estado: true, fecha_limite: true },
    }),
    verPagos
      ? prisma.pago.findFirst({
          where: { tenant_id: tenantId, periodo: getCurrentPeriodo(), estado: "pagado" },
          select: { id: true },
        })
      : Promise.resolve(null),
    conAmbiental
      ? prisma.gestionAmbiental.findMany({
          where: { tenant_id: tenantId, vence: { not: null } },
          select: { vence: true },
        })
      : Promise.resolve(null),
    verPagos
      ? prisma.suscripcion.findUnique({ where: { tenant_id: tenantId }, select: { estado: true, dia_cobro: true } })
      : Promise.resolve(null),
  ]);

  return armarAlertasLocal({
    ahora: new Date(),
    documentos,
    noConformidades,
    pago: verPagos && suscripcion
      ? { suscripcionEstado: suscripcion.estado, pagadoEnPeriodo: Boolean(pagoPeriodo), diaCobro: suscripcion.dia_cobro }
      : null,
    contratoHasta: verPagos ? info.contratoHasta : null,
    vencimientosAmbientales: ambiental,
  });
}
