import type { PrismaClient } from "@prisma/client";
import { evaluarProgramaDelMes, instanteDelDia } from "@/lib/bpm/evaluarMes";
import { inicioSemanaChile } from "@/lib/bpm/programa";
import { programaResuelto } from "@/lib/bpm/programa";
import type { Hallazgo } from "@/server/sello-engine/tipos";

/**
 * Deriva los 4 scores del sello desde los datos operativos del período.
 *
 * Las funciones de scoring son puras (testeables sin BD); `recolectarInputs`
 * hace las queries y las alimenta.
 */

// ── Reglas de negocio ──────────────────────────────────────────────

/** Penalización por no conformidad abierta al cierre del período */
export const PENALIZACION_NC = { mayor: 15, menor: 5 } as const;

/** Penalización por un evento registrado sin acción correctiva */
export const PENALIZACION_EVENTO_SIN_ACCION = 10;

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
    const esperadasTarea = esperadasDeTarea(t.frecuencia, diasDelMes);
    esperadas += esperadasTarea;
    completadas += Math.min(t.completaciones, esperadasTarea);
  }

  return clamp((completadas / esperadas) * 100);
}

export function esperadasDeTarea(frecuencia: string, diasDelMes: number) {
  if (frecuencia === "diaria") return diasDelMes;
  if (frecuencia === "semanal") return Math.ceil(diasDelMes / 7);
  return 1;
}

/** Controles del programa: hecho 1, con observación 0.5, pendiente 0. Sin controles exigibles → 100. */
export function scoreProgramaOperacion(input: {
  estados: Array<"hecho" | "observacion" | "pendiente">;
  eventosSinAccion: number;
  ncAbiertasMayores: number;
  ncAbiertasMenores: number;
}) {
  const base =
    input.estados.length === 0
      ? 100
      : clamp(
          (input.estados.reduce(
            (suma, estado) => suma + (estado === "hecho" ? 1 : estado === "observacion" ? 0.5 : 0),
            0
          ) /
            input.estados.length) *
            100
        );
  const penalizacion =
    input.ncAbiertasMayores * PENALIZACION_NC.mayor +
    input.ncAbiertasMenores * PENALIZACION_NC.menor +
    input.eventosSinAccion * PENALIZACION_EVENTO_SIN_ACCION;
  return clamp(base - penalizacion);
}

// ── Recolección desde la BD ────────────────────────────────────────

export interface ScoresRecolectados {
  score_documentacion: number;
  score_condiciones: number;
  score_capacitaciones: number;
  score_tareas: number;
  hallazgos: Hallazgo[];
  detalle: {
    documentos: { total: number; aprobadosVigentes: number };
    controles: number;
    eventosSinAccion: number;
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

export async function recolectarInputs(
  prisma: PrismaClient,
  tenantId: string,
  periodo: string
): Promise<ScoresRecolectados> {
  const { inicio, fin, diasDelMes } = rangoPeriodo(periodo);
  const desde = new Date(`${inicioSemanaChile(instanteDelDia(`${periodo}-01`))}T00:00:00.000Z`);

  const [config, documentos, registros, ncAbiertas, tareas] = await Promise.all([
    prisma.configuracionBpm.findUnique({
      where: { tenant_id: tenantId },
      select: { programa: true, equipos_frio: true },
    }),
    prisma.documento.findMany({
      where: { tenant_id: tenantId, mes: periodo },
      select: { nombre: true, estado: true, vencimiento: true },
    }),
    prisma.registro.findMany({
      where: { tenant_id: tenantId, fecha: { gte: desde, lte: fin } },
      select: { codigo: true, tipo: true, fecha: true, datos: true },
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
        titulo: true,
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

  const equipos = Array.isArray(config?.equipos_frio)
    ? config.equipos_frio.flatMap((equipo) => {
        if (!equipo || typeof equipo !== "object" || !("nombre" in equipo)) return [];
        return [String((equipo as { nombre: unknown }).nombre)];
      })
    : [];
  const evaluacion = evaluarProgramaDelMes({
    programa: programaResuelto(config?.programa ?? null),
    registros,
    equipos,
    periodo,
  });
  const ncAbiertasMayores = ncAbiertas.filter((nc) => nc.severidad === "mayor").length;
  const ncAbiertasMenores = ncAbiertas.filter((nc) => nc.severidad === "menor").length;
  const realizadas = registros.filter(
    (registro) => registro.codigo === "R-BPM-10-04" || registro.tipo === "capacitacion"
  ).length;

  const hallazgos: Hallazgo[] = [...evaluacion.hallazgos];
  if (documentos.length === 0) {
    hallazgos.push({ dimension: "documentacion", texto: "No hay documentos cargados en el mes." });
  } else {
    for (const documento of documentos) {
      if (documento.estado !== "aprobado") {
        hallazgos.push({ dimension: "documentacion", texto: `${documento.nombre} no está aprobado.` });
      } else if (documento.vencimiento && documento.vencimiento < fin) {
        hallazgos.push({ dimension: "documentacion", texto: `${documento.nombre} está vencido.` });
      }
    }
  }
  if (ncAbiertasMayores > 0) {
    hallazgos.push({
      dimension: "condiciones",
      texto: `Hay ${ncAbiertasMayores} no conformidad${ncAbiertasMayores === 1 ? "" : "es"} mayor${ncAbiertasMayores === 1 ? "" : "es"} abierta${ncAbiertasMayores === 1 ? "" : "s"}.`,
    });
  }
  if (ncAbiertasMenores > 0) {
    hallazgos.push({
      dimension: "condiciones",
      texto: `Hay ${ncAbiertasMenores} no conformidad${ncAbiertasMenores === 1 ? "" : "es"} menor${ncAbiertasMenores === 1 ? "" : "es"} abierta${ncAbiertasMenores === 1 ? "" : "s"}.`,
    });
  }
  if (realizadas === 0) {
    hallazgos.push({ dimension: "capacitaciones", texto: "No hay capacitación registrada en el mes." });
  }
  for (const tarea of tareas) {
    const esperadas = esperadasDeTarea(tarea.frecuencia, diasDelMes);
    if (tarea._count.completaciones < esperadas) {
      hallazgos.push({ dimension: "tareas", texto: `La tarea "${tarea.titulo}" no se completó las veces del mes.` });
    }
  }

  return {
    score_documentacion: scoreDocumentacion({
      total: documentos.length,
      aprobadosVigentes,
    }),
    score_condiciones: scoreProgramaOperacion({
      estados: evaluacion.estados,
      eventosSinAccion: evaluacion.eventosSinAccion,
      ncAbiertasMayores,
      ncAbiertasMenores,
    }),
    score_capacitaciones: scoreCapacitaciones({ realizadas }),
    score_tareas: scoreTareas(
      tareas.map((t) => ({
        frecuencia: t.frecuencia,
        completaciones: t._count.completaciones,
      })),
      diasDelMes
    ),
    hallazgos,
    detalle: {
      documentos: { total: documentos.length, aprobadosVigentes },
      controles: evaluacion.estados.length,
      eventosSinAccion: evaluacion.eventosSinAccion,
      capacitaciones: { realizadas },
      tareas: { activas: tareas.length },
    },
  };
}
