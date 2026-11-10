import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { estadoTrasImpago } from "@/lib/payments/mora";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = new Date();
  const periodo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const suscripciones = await prisma.suscripcion.findMany({
    where: { estado: { in: ["activa", "morosa"] }, tenant: { estado: "activo" } },
    select: { id: true, tenant_id: true, estado: true, dia_cobro: true, monto_clp: true },
  });

  const pagosDelPeriodo = await prisma.pago.findMany({
    where: {
      periodo,
      estado: "pagado",
      tenant_id: { in: suscripciones.map((s) => s.tenant_id) },
    },
    select: { tenant_id: true },
  });
  const tenantsPagados = new Set(pagosDelPeriodo.map((p) => p.tenant_id));

  const cambios: Array<{ id: string; estado: "morosa" | "suspendida" }> = [];
  for (const s of suscripciones) {
    const siguiente = estadoTrasImpago({
      estadoActual: s.estado as "activa" | "morosa" | "suspendida" | "cancelada",
      diaCobro: s.dia_cobro,
      pagadoEstePeriodo: tenantsPagados.has(s.tenant_id),
      ahora: hoy,
    });
    if (siguiente === "morosa" || siguiente === "suspendida") {
      cambios.push({ id: s.id, estado: siguiente });
    }
  }

  for (const cambio of cambios) {
    await prisma.suscripcion.update({ where: { id: cambio.id }, data: { estado: cambio.estado } });
  }

  return NextResponse.json({
    periodo,
    revisadas: suscripciones.length,
    cambios: cambios.length,
    detalle: cambios,
  });
}
