import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

/**
 * Cron diario: marca como morosa toda suscripción activa cuyo día de cobro
 * ya pasó este mes y que no tiene un pago registrado para el período actual.
 *
 * Protegido con CRON_SECRET (Authorization: Bearer <secret>).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = new Date();
  const periodo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const diaActual = hoy.getDate();

  const suscripciones = await prisma.suscripcion.findMany({
    where: {
      estado: "activa",
      dia_cobro: { lt: diaActual },
    },
    include: { tenant: { select: { nombre: true } } },
  });

  // El pago puede no tener suscripcion_id (ej: pagado antes de configurar
  // la suscripción), por eso se busca por tenant y no por relación.
  const pagosDelPeriodo = await prisma.pago.findMany({
    where: {
      periodo,
      estado: "pagado",
      tenant_id: { in: suscripciones.map((s) => s.tenant_id) },
    },
    select: { tenant_id: true },
  });
  const tenantsPagados = new Set(pagosDelPeriodo.map((p) => p.tenant_id));

  const sinPago = suscripciones.filter((s) => !tenantsPagados.has(s.tenant_id));

  if (sinPago.length > 0) {
    await prisma.suscripcion.updateMany({
      where: { id: { in: sinPago.map((s) => s.id) } },
      data: { estado: "morosa" },
    });
  }

  const marcadas = sinPago.map((s) => ({
    tenant: s.tenant.nombre,
    dia_cobro: s.dia_cobro,
    monto_clp: s.monto_clp,
  }));

  console.log(
    `[cron/marcar-morosos] Período ${periodo}: ${marcadas.length} suscripciones marcadas morosas de ${suscripciones.length} revisadas`
  );

  return NextResponse.json({
    periodo,
    revisadas: suscripciones.length,
    marcadas: marcadas.length,
    detalle: marcadas,
  });
}
