export const COMPONENTES_SEGUIMIENTO = [
  { id: "registros", etiqueta: "Registros completos y oportunos", puntos: 20 },
  { id: "controles", etiqueta: "Controles sanitarios documentados", puntos: 20 },
  { id: "correctivas", etiqueta: "Acciones correctivas y seguimiento", puntos: 15 },
  { id: "procedimientos", etiqueta: "Procedimientos y documentación", puntos: 5 },
] as const;

export const COMPONENTES_VISITA = [
  { id: "higiene", etiqueta: "Higiene y manipulación", puntos: 15 },
  { id: "instalaciones", etiqueta: "Instalaciones y equipos", puntos: 10 },
  { id: "almacenamiento", etiqueta: "Almacenamiento y prevención de contaminación", puntos: 10 },
  { id: "verificacion", etiqueta: "Verificación de registros y acciones", puntos: 5 },
] as const;

export type IdComponenteSeguimiento = (typeof COMPONENTES_SEGUIMIENTO)[number]["id"];
export type IdComponenteVisita = (typeof COMPONENTES_VISITA)[number]["id"];

export type NivelSelloV2 = "sin_sello" | "bronce" | "plata" | "oro";

export const UMBRALES_V2 = {
  bronce: 70,
  plata: 85,
  oro: 95,
} as const;

export type ItemControl = {
  id: string;
  aplicable: boolean;
  /** 0..1. Ignorado si no aplicable. Falta de evidencia = 0. */
  logro: number;
};

export function puntajeComponente(puntosMaximos: number, items: ItemControl[]): number {
  const aplicables = items.filter((item) => item.aplicable);
  if (aplicables.length === 0) return 0;
  const promedio = aplicables.reduce((suma, item) => suma + Math.min(1, Math.max(0, item.logro)), 0) / aplicables.length;
  return Math.round(promedio * puntosMaximos * 100) / 100;
}

export function nivelDesdePuntaje(score: number, bloqueoCritico: boolean): NivelSelloV2 {
  if (bloqueoCritico) return "sin_sello";
  if (score >= UMBRALES_V2.oro) return "oro";
  if (score >= UMBRALES_V2.plata) return "plata";
  if (score >= UMBRALES_V2.bronce) return "bronce";
  return "sin_sello";
}

export type ResultadoSelloV2 = {
  nivel: NivelSelloV2;
  score_general: number;
  score_seguimiento: number;
  score_visita: number;
  bloqueo_critico: boolean;
  componentes: Record<string, number>;
  plan_mejoras: string[];
};

export function calcularSelloV2(input: {
  seguimiento: Record<IdComponenteSeguimiento, ItemControl[]>;
  visita: Record<IdComponenteVisita, ItemControl[]>;
  bloqueoCritico: boolean;
}): ResultadoSelloV2 {
  const componentes: Record<string, number> = {};
  let score_seguimiento = 0;
  for (const componente of COMPONENTES_SEGUIMIENTO) {
    const pts = puntajeComponente(componente.puntos, input.seguimiento[componente.id] ?? []);
    componentes[componente.id] = pts;
    score_seguimiento += pts;
  }
  let score_visita = 0;
  for (const componente of COMPONENTES_VISITA) {
    const pts = puntajeComponente(componente.puntos, input.visita[componente.id] ?? []);
    componentes[componente.id] = pts;
    score_visita += pts;
  }
  score_seguimiento = Math.round(score_seguimiento * 100) / 100;
  score_visita = Math.round(score_visita * 100) / 100;
  const score_general = Math.round((score_seguimiento + score_visita) * 100) / 100;
  const nivel = nivelDesdePuntaje(score_general, input.bloqueoCritico);
  const plan_mejoras: string[] = [];
  if (input.bloqueoCritico) {
    plan_mejoras.push("Hay un hallazgo crítico abierto. No se emite sello hasta cerrarlo con evidencia validada.");
  }
  for (const componente of [...COMPONENTES_SEGUIMIENTO, ...COMPONENTES_VISITA]) {
    const pts = componentes[componente.id] ?? 0;
    if (pts < componente.puntos) {
      plan_mejoras.push(`${componente.etiqueta}: ${pts} de ${componente.puntos} pts.`);
    }
  }
  return {
    nivel,
    score_general,
    score_seguimiento,
    score_visita,
    bloqueo_critico: input.bloqueoCritico,
    componentes,
    plan_mejoras,
  };
}

export const ETIQUETA_NIVEL_V2: Record<NivelSelloV2, string> = {
  sin_sello: "Sin sello",
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
};

export const CRITERIO_VISITA_POR_PAUTA: Record<string, IdComponenteVisita> = {
  higiene: "higiene",
  capacitacion: "higiene",
  produccion: "higiene",
  documentacion: "instalaciones",
  limpieza: "instalaciones",
  agua: "instalaciones",
  residuos: "instalaciones",
  almacenamiento: "almacenamiento",
  recepcion: "almacenamiento",
  trazabilidad: "almacenamiento",
  plagas: "almacenamiento",
  seguimiento: "verificacion",
};
