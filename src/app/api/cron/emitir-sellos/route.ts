import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export const maxDuration = 60;

/**
 * El sello v2 no se emite solo: el asesor propone y admin_nucleo aprueba.
 * Este cron deja un recordatorio de propuestas pendientes.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pendientes = await prisma.sello.count({ where: { estado: "propuesto", esquema: "v2" } });
  return NextResponse.json({
    ok: true,
    propuestasPendientes: pendientes,
    mensaje: "La emisión automática está desactivada. Una socia debe aprobar cada sello.",
  });
}
