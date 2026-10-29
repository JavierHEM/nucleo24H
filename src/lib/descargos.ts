import { z } from "zod";

export const ESTADOS_DESCARGO = ["abierto", "en_revision", "presentado", "cerrado"] as const;
export type EstadoDescargo = (typeof ESTADOS_DESCARGO)[number];

export const ESTADO_DESCARGO_LABEL: Record<EstadoDescargo, string> = {
  abierto: "Abierto",
  en_revision: "En revisión",
  presentado: "Presentado",
  cerrado: "Cerrado",
};

export const RESULTADOS_FISCALIZACION = ["sin_observaciones", "con_observaciones", "sumario"] as const;
export type ResultadoFiscalizacion = (typeof RESULTADOS_FISCALIZACION)[number];

export const RESULTADO_FISCALIZACION_LABEL: Record<ResultadoFiscalizacion, string> = {
  sin_observaciones: "Sin observaciones",
  con_observaciones: "Con observaciones",
  sumario: "Sumario sanitario",
};

export const MAX_ADJUNTOS_DESCARGO = 5;

export const fiscalizacionSchema = z.object({
  fecha: z.string().datetime(),
  autoridad: z.string().trim().min(2, "Indica la autoridad que fiscalizó.").max(120),
  resultado: z.enum(RESULTADOS_FISCALIZACION),
  detalle: z.string().trim().max(2000).optional(),
  acta_url: z.string().min(1).max(500).optional(),
});

export const solicitudDescargoSchema = z.object({
  titulo: z.string().trim().min(3, "Escribe un título breve.").max(140),
  descripcion: z.string().trim().min(10, "Cuéntanos qué ocurrió para poder ayudarte.").max(4000),
  fiscalizacion_id: z.string().uuid().optional(),
  adjuntos: z.array(z.string().min(1).max(500)).max(MAX_ADJUNTOS_DESCARGO).default([]),
});

export type ElegibilidadDescargo = {
  habilitado: boolean;
  motivo: string | null;
  puntosFaltantes: number | null;
};

export type SelloParaDescargo = { nivel: string; score_general: number; periodo: string };

export function elegibilidadDescargo(sello: SelloParaDescargo | null, umbralPremium: number): ElegibilidadDescargo {
  if (!sello) {
    return {
      habilitado: false,
      motivo: "Aún no hay un sello emitido. Los descargos gratuitos se habilitan con sello Premium.",
      puntosFaltantes: null,
    };
  }
  if (sello.nivel === "premium") {
    return { habilitado: true, motivo: null, puntosFaltantes: 0 };
  }
  const faltantes = Math.max(1, Math.ceil(umbralPremium - sello.score_general));
  return {
    habilitado: false,
    motivo: `El último sello emitido (${sello.periodo}) es ${sello.nivel} con ${Math.round(sello.score_general)}%. Faltan ${faltantes} puntos para el nivel Premium (${umbralPremium}%).`,
    puntosFaltantes: faltantes,
  };
}

export function transicionDescargoValida(actual: EstadoDescargo, siguiente: EstadoDescargo): boolean {
  return ESTADOS_DESCARGO.indexOf(siguiente) > ESTADOS_DESCARGO.indexOf(actual);
}

export function esEstadoDescargo(valor: string): valor is EstadoDescargo {
  return (ESTADOS_DESCARGO as readonly string[]).includes(valor);
}

export function textoAvisoDescargo(titulo: string) {
  return `Se abrió una solicitud de descargo: "${titulo}". Revísala en Fiscalizaciones.`;
}

export function textoRespuestaDescargo(titulo: string, estado: EstadoDescargo) {
  return `Tu solicitud de descargo "${titulo}" cambió a ${ESTADO_DESCARGO_LABEL[estado].toLowerCase()}.`;
}
