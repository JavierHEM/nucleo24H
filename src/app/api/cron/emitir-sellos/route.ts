import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { recolectarInputs } from "@/server/sello-engine/recolectar";
import { emitirSello } from "@/server/sello-engine/emitirService";

export const maxDuration = 300;

/** Período anterior al actual: si hoy es 2026-06-01, emite sellos de 2026-05 */
function periodoAnterior(ahora = new Date()): string {
  const d = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Cron mensual (día 1): calcula y emite el sello del mes recién cerrado
 * para todos los locales activos. No sobreescribe sellos ya emitidos
 * manualmente por un asesor.
 *
 * Protegido con CRON_SECRET (header Authorization: Bearer <secret>,
 * el formato que envía Vercel Cron automáticamente).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const periodo =
    req.nextUrl.searchParams.get("periodo") ?? periodoAnterior();
  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const tenants = await prisma.tenant.findMany({
    where: { estado: "activo" },
    select: { id: true, nombre: true },
  });

  const resultados: Array<{
    tenant: string;
    estado: "emitido" | "omitido" | "error";
    nivel?: string;
    score?: number;
    error?: string;
  }> = [];

  for (const tenant of tenants) {
    try {
      const inputs = await recolectarInputs(prisma, tenant.id, periodo);
      const { sello, omitido } = await emitirSello({
        prisma,
        tenantId: tenant.id,
        periodo,
        scores: {
          score_documentacion: inputs.score_documentacion,
          score_condiciones: inputs.score_condiciones,
          score_capacitaciones: inputs.score_capacitaciones,
          score_tareas: inputs.score_tareas,
        },
        emitidoPor: "system",
        inputsSnapshot: JSON.parse(JSON.stringify(inputs)),
        hallazgos: inputs.hallazgos,
        noSobreescribir: true,
      });

      resultados.push(
        omitido
          ? { tenant: tenant.nombre, estado: "omitido" }
          : {
              tenant: tenant.nombre,
              estado: "emitido",
              nivel: sello!.nivel,
              score: sello!.score_general,
            }
      );
    } catch (err) {
      console.error(`[cron/emitir-sellos] Error en tenant ${tenant.id}:`, err);
      resultados.push({
        tenant: tenant.nombre,
        estado: "error",
        error: err instanceof Error ? err.message : "desconocido",
      });
    }
  }

  const emitidos = resultados.filter((r) => r.estado === "emitido").length;
  const omitidos = resultados.filter((r) => r.estado === "omitido").length;
  const errores = resultados.filter((r) => r.estado === "error").length;

  console.log(
    `[cron/emitir-sellos] Período ${periodo}: ${emitidos} emitidos, ${omitidos} omitidos, ${errores} errores`
  );

  return NextResponse.json({ periodo, emitidos, omitidos, errores, resultados });
}
