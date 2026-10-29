export const PLAN_IDS = ["calidad", "integral"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type ModuloPlan = "ambiental";

export const CONTRATO_MESES = 12;
export const AVISO_RENOVACION_DIAS = 60;
export const DECLARACIONES_VU_ANUALES = 12;

export const PLAN_PRECIOS_CLP: Record<PlanId, number> = {
  calidad: 80_000,
  integral: 150_000,
};

const BENEFICIOS_CALIDAD = [
  "1 visita presencial mensual en radio urbano",
  "Revisión de registros y documentación",
  "Capacitación mensual para el equipo",
  "Plataforma documental actualizada",
  "Informe mensual de cumplimiento",
  "Plan de mejoras personalizado",
  "Evaluación y entrega de sello mensual",
  "Orientación técnica permanente",
  "Apoyo ante fiscalizaciones",
  "Descargos gratuitos con sello Premium",
] as const;

const BENEFICIOS_AMBIENTALES = [
  "Apoyo en segregación de residuos: ordinarios, reciclables y peligrosos",
  "Declaraciones en Ventanilla Única, hasta 12 al año",
  "Charlas ambientales para el equipo",
  "Asesoría en cumplimiento ambiental",
  "Seguimiento y recordatorios de vencimientos",
] as const;

export type Beneficio = { texto: string; modulo?: ModuloPlan };

export type DefinicionPlan = {
  id: PlanId;
  nombre: string;
  etiqueta: string;
  descripcion: string;
  precio: number;
  modulos: readonly ModuloPlan[];
  resumen: readonly string[];
  beneficios: readonly Beneficio[];
};

const BENEFICIOS_BASE: Beneficio[] = BENEFICIOS_CALIDAD.map((texto) => ({ texto }));
const BENEFICIOS_AMBIENTAL: Beneficio[] = BENEFICIOS_AMBIENTALES.map((texto) => ({
  texto,
  modulo: "ambiental",
}));

export const PLANES: Record<PlanId, DefinicionPlan> = {
  calidad: {
    id: "calidad",
    nombre: "Plan Calidad",
    etiqueta: "Para partir",
    descripcion: "BPM, documentos, capacitaciones y sellos",
    precio: PLAN_PRECIOS_CLP.calidad,
    modulos: [],
    resumen: BENEFICIOS_CALIDAD,
    beneficios: BENEFICIOS_BASE,
  },
  integral: {
    id: "integral",
    nombre: "Plan Integral",
    etiqueta: "Calidad + medio ambiente",
    descripcion: "Todo lo anterior + gestión ambiental y Ventanilla Única",
    precio: PLAN_PRECIOS_CLP.integral,
    modulos: ["ambiental"],
    resumen: ["Todo lo del Plan Calidad", ...BENEFICIOS_AMBIENTALES],
    beneficios: [...BENEFICIOS_BASE, ...BENEFICIOS_AMBIENTAL],
  },
};

export const TIPOS_LOCAL = ["restaurante", "cafeteria", "cocineria", "food_truck"] as const;
export type TipoLocal = (typeof TIPOS_LOCAL)[number];

export const TIPO_LOCAL_LABEL: Record<TipoLocal, string> = {
  restaurante: "Restaurante",
  cafeteria: "Cafetería",
  cocineria: "Cocinería",
  food_truck: "Food truck",
};

export function esPlanId(valor: unknown): valor is PlanId {
  return typeof valor === "string" && (PLAN_IDS as readonly string[]).includes(valor);
}

export function normalizarPlan(valor: unknown): PlanId {
  return esPlanId(valor) ? valor : "calidad";
}

export function esTipoLocal(valor: unknown): valor is TipoLocal {
  return typeof valor === "string" && (TIPOS_LOCAL as readonly string[]).includes(valor);
}

export function normalizarTipoLocal(valor: unknown): TipoLocal {
  return esTipoLocal(valor) ? valor : "restaurante";
}

export function planIncluye(plan: unknown, modulo: ModuloPlan): boolean {
  return PLANES[normalizarPlan(plan)].modulos.includes(modulo);
}

export function etiquetaPlan(plan: unknown): string {
  return PLANES[normalizarPlan(plan)].nombre;
}

export function finDeContrato(desde: Date): Date {
  const fin = new Date(desde);
  fin.setMonth(fin.getMonth() + CONTRATO_MESES);
  return fin;
}

/**
 * Año de contrato que contiene a `ahora`, anclado en la fecha de inicio del contrato.
 * Sin contrato definido se usa el año calendario.
 */
export function cicloContrato(desde: Date | null | undefined, ahora: Date = new Date()): { inicio: Date; fin: Date } {
  if (!desde || desde > ahora) {
    return { inicio: new Date(ahora.getFullYear(), 0, 1), fin: new Date(ahora.getFullYear() + 1, 0, 1) };
  }
  let inicio = new Date(desde);
  for (;;) {
    const siguiente = new Date(inicio);
    siguiente.setMonth(siguiente.getMonth() + CONTRATO_MESES);
    if (siguiente > ahora) return { inicio, fin: siguiente };
    inicio = siguiente;
  }
}

export function diasParaFecha(fecha: Date, ahora: Date = new Date()): number {
  return Math.ceil((fecha.getTime() - ahora.getTime()) / 86_400_000);
}

export function contratoPorVencer(hasta: Date | null | undefined, ahora: Date = new Date()): boolean {
  if (!hasta) return false;
  return diasParaFecha(hasta, ahora) <= AVISO_RENOVACION_DIAS;
}

export type EstadoContrato = "sin_definir" | "vigente" | "por_vencer" | "vencido";

export function estadoContrato(
  hasta: Date | null | undefined,
  ahora: Date = new Date()
): { estado: EstadoContrato; dias: number | null } {
  if (!hasta) return { estado: "sin_definir", dias: null };
  const dias = diasParaFecha(hasta, ahora);
  if (dias < 0) return { estado: "vencido", dias };
  return { estado: dias <= AVISO_RENOVACION_DIAS ? "por_vencer" : "vigente", dias };
}
