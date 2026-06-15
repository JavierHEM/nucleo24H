import type { PrismaClient } from "@prisma/client";

/**
 * Deriva los 4 scores del sello desde los datos operativos del período.
 *
 * Las funciones de scoring son puras (testeables sin BD); `recolectarInputs`
 * hace las queries y las alimenta.
 */

// ── Reglas de negocio ──────────────────────────────────────────────

/** Penalización por no conformidad abierta al cierre del período */
export const PENALIZACION_NC = { mayor: 15, menor: 5 } as const;

/** Capacitaciones esperadas por mes */
export const CAPACITACIONES_ESPERADAS_MES = 1;

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

/**
 * Documentación: % de documentos del mes aprobados y vigentes.
 * Sin documentos cargados → 0 (la documentación mensual es obligatoria).
 */
export function scoreDocumentacion(input: {
  total: number;
  aprobadosVigentes: number;
}): number {
  if (input.total === 0) return 0;
  return clamp((input.aprobadosVigentes / input.total) * 100);
}

/**
 * Condiciones sanitarias: cobertura diaria de registros de temperatura y
 * limpieza (90% del score) + control de plagas mensual (10%), menos
 * penalización por NCs abiertas.
 */
export function scoreCondiciones(input: {
  diasConTemperatura: number;
  diasConLimpieza: number;
  diasDelMes: number;
  tieneControlPlagas: boolean;
  ncAbiertasMayores: number;
  ncAbiertasMenores: number;
}): number {
  const coberturaTemp = input.diasConTemperatura / input.diasDelMes;
  const coberturaLimpieza = input.diasConLimpieza / input.diasDelMes;
  const base =
    ((coberturaTemp + coberturaLimpieza) / 2) * 90 +
    (input.tieneControlPlagas ? 10 : 0);

  const penalizacion =
    input.ncAbiertasMayores * PENALIZACION_NC.mayor +
    input.ncAbiertasMenores * PENALIZACION_NC.menor;

  return clamp(base - penalizacion);
}

/** Capacitaciones: realizadas vs esperadas en el mes (tope 100). */
export function scoreCapacitaciones(input: {
  realizadas: number;
  esperadas?: number;
}): number {
  const esperadas = input.esperadas ?? CAPACITACIONES_ESPERADAS_MES;
  if (esperadas === 0) return 100;
  return clamp((input.realizadas / esperadas) * 100);
}

/**
 * Tareas: completaciones vs esperadas según frecuencia de cada tarea
 * (diaria → días del mes, semanal → semanas, mensual → 1).
 * Sin tareas configuradas → 100 (no hay nada exigible).
 */
export function scoreTareas(
  tareas: Array<{
    frecuencia: string;
    completaciones: number;
  }>,
  diasDelMes: number
): number {
  if (tareas.length === 0) return 100;

  let esperadas = 0;
  let completadas = 0;
  for (const t of tareas) {
    const esperadasTarea =
      t.frecuencia === "diaria"
        ? diasDelMes
        : t.frecuencia === "semanal"
          ? Math.ceil(diasDelMes / 7)
          : 1;
    esperadas += esperadasTarea;
    completadas += Math.min(t.completaciones, esperadasTarea);
  }

  return clamp((completadas / esperadas) * 100);
}

// ── Recolección desde la BD ────────────────────────────────────────

export interface ScoresRecolectados {
  score_documentacion: number;
  score_condiciones: number;
  score_capacitaciones: number;
  score_tareas: number;
  detalle: {
    documentos: { total: number; aprobadosVigentes: number };
    condiciones: {
      diasConTemperatura: number;
      diasConLimpieza: number;
      diasDelMes: number;
      tieneControlPlagas: boolean;
      ncAbiertasMayores: number;
      ncAbiertasMenores: number;
    };
    capacitaciones: { realizadas: number };
    tareas: { activas: number };
  };
}

function rangoPeriodo(periodo: string) {
  const [year, month] = periodo.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fin = new Date(year, month, 0, 23, 59, 59, 999);
  return { inicio, fin, diasDelMes: fin.getDate() };
}

function diasDistintos(fechas: Array<{ fecha: Date }>): number {
  return new Set(fechas.map((r) => r.fecha.toISOString().slice(0, 10))).size;
}

export async function recolectarInputs(
  prisma: PrismaClient,
  tenantId: string,
  periodo: string
): Promise<ScoresRecolectados> {
  const { inicio, fin, diasDelMes } = rangoPeriodo(periodo);

  const [documentos, registros, ncAbiertas, tareas] = await Promise.all([
    prisma.documento.findMany({
      where: { tenant_id: tenantId, mes: periodo },
      select: { estado: true, vencimiento: true },
    }),
    prisma.registro.findMany({
      where: { tenant_id: tenantId, fecha: { gte: inicio, lte: fin } },
      select: { tipo: true, fecha: true },
    }),
    prisma.noConformidad.findMany({
      where: {
        estado: { not: "cerrada" },
        visita: { tenant_id: tenantId, fecha: { lte: fin } },
      },
      select: { severidad: true },
    }),
    prisma.tarea.findMany({
      where: { tenant_id: tenantId, activa: true },
      select: {
        frecuencia: true,
        _count: {
          select: {
            completaciones: { where: { fecha: { gte: inicio, lte: fin } } },
          },
        },
      },
    }),
  ]);

  const aprobadosVigentes = documentos.filter(
    (d) => d.estado === "aprobado" && (!d.vencimiento || d.vencimiento >= fin)
  ).length;

  const temperatura = registros.filter((r) => r.tipo === "temperatura");
  const limpieza = registros.filter((r) => r.tipo === "limpieza");
  const plagas = registros.filter((r) => r.tipo === "plagas");
  const capacitaciones = registros.filter((r) => r.tipo === "capacitacion");

  const condiciones = {
    diasConTemperatura: diasDistintos(temperatura),
    diasConLimpieza: diasDistintos(limpieza),
    diasDelMes,
    tieneControlPlagas: plagas.length > 0,
    ncAbiertasMayores: ncAbiertas.filter((nc) => nc.severidad === "mayor").length,
    ncAbiertasMenores: ncAbiertas.filter((nc) => nc.severidad === "menor").length,
  };

  return {
    score_documentacion: scoreDocumentacion({
      total: documentos.length,
      aprobadosVigentes,
    }),
    score_condiciones: scoreCondiciones(condiciones),
    score_capacitaciones: scoreCapacitaciones({
      realizadas: capacitaciones.length,
    }),
    score_tareas: scoreTareas(
      tareas.map((t) => ({
        frecuencia: t.frecuencia,
        completaciones: t._count.completaciones,
      })),
      diasDelMes
    ),
    detalle: {
      documentos: { total: documentos.length, aprobadosVigentes },
      condiciones,
      capacitaciones: { realizadas: capacitaciones.length },
      tareas: { activas: tareas.length },
    },
  };
}
