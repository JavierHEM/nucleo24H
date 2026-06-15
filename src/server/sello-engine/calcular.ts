import {
  SelloInputSchema,
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

  // Plan de mejoras: identifica brechas por dimensión
  const plan_mejoras: string[] = [];

  if (score_documentacion < BRECHAS_THRESHOLDS.documentacion) {
    const brecha = Math.ceil(BRECHAS_THRESHOLDS.documentacion - score_documentacion);
    plan_mejoras.push(
      `Completar documentación pendiente (+${brecha}% para cumplir el mínimo recomendado)`
    );
  }
  if (score_condiciones < BRECHAS_THRESHOLDS.condiciones) {
    const brecha = Math.ceil(BRECHAS_THRESHOLDS.condiciones - score_condiciones);
    plan_mejoras.push(
      `Mejorar condiciones sanitarias: registros de temperatura y limpieza (+${brecha}%)`
    );
  }
  if (score_capacitaciones < BRECHAS_THRESHOLDS.capacitaciones) {
    const brecha = Math.ceil(BRECHAS_THRESHOLDS.capacitaciones - score_capacitaciones);
    plan_mejoras.push(
      `Aumentar asistencia a capacitaciones del equipo (+${brecha}%)`
    );
  }
  if (score_tareas < BRECHAS_THRESHOLDS.tareas) {
    const brecha = Math.ceil(BRECHAS_THRESHOLDS.tareas - score_tareas);
    plan_mejoras.push(
      `Cerrar tareas pendientes de la última visita del asesor (+${brecha}%)`
    );
  }

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
