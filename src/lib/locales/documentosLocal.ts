export type DocumentosLocal = {
  resolucion_sanitaria_presentada: boolean;
  patente_comercial_al_dia: boolean;
};

export function documentosHabilitanSello(local: DocumentosLocal): boolean {
  return local.resolucion_sanitaria_presentada && local.patente_comercial_al_dia;
}

export function mensajeBloqueoSelloPorDocumentos(local: DocumentosLocal): string | null {
  const faltan: string[] = [];
  if (!local.resolucion_sanitaria_presentada) faltan.push("resolución sanitaria");
  if (!local.patente_comercial_al_dia) faltan.push("patente comercial al día");
  if (faltan.length === 0) return null;
  if (faltan.length === 2) {
    return "Este local no puede obtener el sello de Núcleo: falta resolución sanitaria y patente comercial al día.";
  }
  return `Este local no puede obtener el sello de Núcleo: falta ${faltan[0]}.`;
}
