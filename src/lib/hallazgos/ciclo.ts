export const GRAVEDADES = ["critico", "mayor", "menor"] as const;
export type GravedadHallazgo = (typeof GRAVEDADES)[number];

export const ESTADOS_HALLAZGO = [
  "abierto",
  "medida_inmediata",
  "accion_informada",
  "evidencia_en_revision",
  "cerrado_validado",
  "seguimiento_eficacia",
  "pendiente_verificacion_presencial",
] as const;
export type EstadoHallazgo = (typeof ESTADOS_HALLAZGO)[number];

export const ESTADOS_EVIDENCIA = ["declarado_cliente", "revisado_documental", "verificado_visita"] as const;
export type EstadoEvidencia = (typeof ESTADOS_EVIDENCIA)[number];

export const ETIQUETA_GRAVEDAD: Record<GravedadHallazgo, string> = {
  critico: "Crítico",
  mayor: "Mayor",
  menor: "Menor",
};

export const ETIQUETA_ESTADO_HALLAZGO: Record<EstadoHallazgo, string> = {
  abierto: "Abierto",
  medida_inmediata: "Medida inmediata aplicada",
  accion_informada: "Acción informada",
  evidencia_en_revision: "Evidencia en revisión",
  cerrado_validado: "Cerrado validado",
  seguimiento_eficacia: "Seguimiento de eficacia",
  pendiente_verificacion_presencial: "Pendiente de verificación presencial",
};

export const ESTADOS_QUE_BLOQUEAN_SELLO: ReadonlySet<string> = new Set([
  "abierto",
  "medida_inmediata",
  "accion_informada",
  "evidencia_en_revision",
  "pendiente_verificacion_presencial",
]);

export function hallazgoBloqueaSello(gravedad: string, estado: string): boolean {
  return gravedad === "critico" && ESTADOS_QUE_BLOQUEAN_SELLO.has(estado);
}

export const TRANSICIONES: Record<EstadoHallazgo, readonly EstadoHallazgo[]> = {
  abierto: ["medida_inmediata"],
  medida_inmediata: ["accion_informada"],
  accion_informada: ["evidencia_en_revision"],
  evidencia_en_revision: ["cerrado_validado", "pendiente_verificacion_presencial", "accion_informada"],
  cerrado_validado: ["seguimiento_eficacia", "abierto"],
  seguimiento_eficacia: [],
  pendiente_verificacion_presencial: ["cerrado_validado", "accion_informada"],
};

export const ETIQUETA_EVIDENCIA: Record<EstadoEvidencia, string> = {
  declarado_cliente: "Declarado por el cliente",
  revisado_documental: "Revisado documentalmente",
  verificado_visita: "Verificado en visita",
};

export function transicionHallazgo(estadoActual: string, destino: string, rol: string): boolean {
  if (estadoActual === destino) return false;
  if (!(ESTADOS_HALLAZGO as readonly string[]).includes(destino)) return false;
  const actuales = TRANSICIONES[estadoActual as EstadoHallazgo];
  if (!actuales?.includes(destino as EstadoHallazgo)) return false;

  const staff = rol === "asesor" || rol === "admin_nucleo";
  const local = rol === "admin_local" || rol === "jefe_local" || rol === "trabajador_local";

  if (destino === "cerrado_validado" || destino === "seguimiento_eficacia") return staff;
  if (destino === "pendiente_verificacion_presencial") return staff;
  if (destino === "abierto") return staff;
  if (destino === "evidencia_en_revision" || destino === "medida_inmediata" || destino === "accion_informada") {
    return local || staff;
  }
  return false;
}

export function destinosPermitidos(estadoActual: string, rol: string): EstadoHallazgo[] {
  const siguientes = TRANSICIONES[estadoActual as EstadoHallazgo] ?? [];
  return siguientes.filter((destino) => transicionHallazgo(estadoActual, destino, rol));
}
