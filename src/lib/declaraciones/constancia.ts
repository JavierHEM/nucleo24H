import { DECLARACIONES, type TipoDeclaracion } from "./textos";

export const RECURSOS_CONSTANCIA = ["registro", "documento", "hallazgo", "proveedor", "ticket"] as const;
export type RecursoConstancia = (typeof RECURSOS_CONSTANCIA)[number];

export const ETIQUETA_EVENTO_DECLARACION: Record<string, string> = {
  completar_registro: "Completar registro",
  cargar_planilla_papel: "Cargar planilla en papel",
  adjuntar_documento: "Adjuntar documento",
  adjuntar_documento_proveedor: "Adjuntar documento de proveedor",
  adjuntar_evidencia_peticion: "Adjuntar evidencia a petición",
  solicitar_cierre_hallazgo: "Solicitar cierre de hallazgo",
  aceptacion_servicio: "Aceptación del servicio",
};

export type ConstanciaConsultable = {
  id: string;
  tipo: string;
  version: string;
  texto: string;
  evento: string;
  created_at: Date;
  firmante: string;
};

export type DeclaracionFila = {
  id: string;
  tipo: string;
  version: string;
  texto: string;
  evento: string;
  created_at: Date;
  user_id: string;
};

export function etiquetaTipoDeclaracion(tipo: string): string {
  if (tipo in DECLARACIONES) {
    return `Declaración ${tipo} · ${DECLARACIONES[tipo as TipoDeclaracion].titulo}`;
  }
  return `Declaración ${tipo}`;
}

export function etiquetaEventoDeclaracion(evento: string): string {
  return ETIQUETA_EVENTO_DECLARACION[evento] ?? evento.replace(/_/g, " ");
}

export function armarConstancias(
  filas: DeclaracionFila[],
  firmantes: Record<string, string>
): ConstanciaConsultable[] {
  return filas.map((fila) => ({
    id: fila.id,
    tipo: fila.tipo,
    version: fila.version,
    texto: fila.texto,
    evento: fila.evento,
    created_at: fila.created_at,
    firmante: firmantes[fila.user_id] ?? "Usuario no disponible",
  }));
}
