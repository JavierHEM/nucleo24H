import {
  SelloInputSchema,
  type DimensionSello,
  type Hallazgo,
  type SelloInput,
  type SelloResult,
  type NivelSello,
  BRECHAS_THRESHOLDS,
} from "./tipos";

/**
 * Función pura — no tiene side effects (sin BD, sin HTTP, sin I/O).
 * Toda la entrada llega como parámetro; cualquier efecto ocurre en el router tRPC.
 */
export function calcularSello(input: SelloInput): SelloResult {
  const parsed = SelloInputSchema.parse(input);

  const {
    score_documentacion,
    score_condiciones,
    score_capacitaciones,
    score_tareas,
    pesos,
    umbrales,
    hallazgos,
  } = parsed;

  // Score general ponderado
  const score_general =
    score_documentacion * pesos.documentacion +
    score_condiciones * pesos.condiciones +
    score_capacitaciones * pesos.capacitaciones +
    score_tareas * pesos.tareas;

  const score = Math.round(score_general * 100) / 100;

  // Nivel según umbrales configurables
  let nivel: NivelSello;
  if (score >= umbrales.premium) {
    nivel = "premium";
  } else if (score >= umbrales.avanzado) {
    nivel = "avanzado";
  } else if (score >= umbrales.intermedio) {
    nivel = "intermedio";
  } else {
    nivel = "inicial";
  }

  const plan_mejoras: string[] = [
    ...lineasDe(
      "documentacion",
      score_documentacion,
      hallazgos,
      `Completar documentación pendiente (+${Math.ceil(BRECHAS_THRESHOLDS.documentacion - score_documentacion)}% para cumplir el mínimo recomendado)`
    ),
    ...lineasDe(
      "condiciones",
      score_condiciones,
      hallazgos,
      `Mejorar condiciones sanitarias: registros de temperatura y limpieza (+${Math.ceil(BRECHAS_THRESHOLDS.condiciones - score_condiciones)}%)`
    ),
    ...lineasDe(
      "capacitaciones",
      score_capacitaciones,
      hallazgos,
      `Aumentar asistencia a capacitaciones del equipo (+${Math.ceil(BRECHAS_THRESHOLDS.capacitaciones - score_capacitaciones)}%)`
    ),
    ...lineasDe(
      "tareas",
      score_tareas,
      hallazgos,
      `Cerrar tareas pendientes de la última visita del asesor (+${Math.ceil(BRECHAS_THRESHOLDS.tareas - score_tareas)}%)`
    ),
  ];

  // Si nivel < premium pero casi llega, agregar mensaje motivacional
  if (nivel === "avanzado" && score < umbrales.premium) {
    const falta = Math.ceil(umbrales.premium - score);
    plan_mejoras.push(
      `Solo te faltan ${falta}% para alcanzar el sello Premium y habilitar descargos gratuitos`
    );
  }

  // Descargos gratuitos solo con nivel Premium
  const descargos_habilitados = nivel === "premium";

  return {
    nivel,
    score_general: score,
    score_documentacion,
    score_condiciones,
    score_capacitaciones,
    score_tareas,
    plan_mejoras,
    descargos_habilitados,
    pesos_usados: pesos,
    umbrales_usados: umbrales,
  };
}

function lineasDe(
  dimension: DimensionSello,
  score: number,
  hallazgos: Hallazgo[] | undefined,
  generica: string
) {
  if (score >= BRECHAS_THRESHOLDS[dimension]) return [];
  const propias = (hallazgos ?? [])
    .filter((item) => item.dimension === dimension)
    .map((item) => item.texto);
  return propias.length > 0 ? propias : [generica];
}
