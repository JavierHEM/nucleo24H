export const TICKET_ESTADOS = ["abierta", "en_atencion", "resuelta"] as const;
export type TicketEstado = (typeof TICKET_ESTADOS)[number];
export const TICKET_ESTADOS_ABIERTOS = ["abierta", "en_atencion"] as const satisfies readonly TicketEstado[];

export const TICKET_CATEGORIAS = ["consulta", "incidencia", "documentos", "visita", "otro"] as const;
export type TicketCategoria = (typeof TICKET_CATEGORIAS)[number];

export const TICKET_PRIORIDADES = ["normal", "urgente"] as const;
export type TicketPrioridad = (typeof TICKET_PRIORIDADES)[number];

export const ETIQUETA_ESTADO: Record<TicketEstado, string> = {
  abierta: "Abierta",
  en_atencion: "En atención",
  resuelta: "Resuelta",
};

export const ETIQUETA_CATEGORIA: Record<TicketCategoria, string> = {
  consulta: "Consulta",
  incidencia: "Soporte de plataforma",
  documentos: "Documentos",
  visita: "Visita",
  otro: "Otro",
};

export const ETIQUETA_PRIORIDAD: Record<TicketPrioridad, string> = {
  normal: "Normal",
  urgente: "Urgente",
};

export type AccionTicket = "atender" | "resolver" | "reabrir";

export function esStaffNucleo(rol: string | null | undefined): boolean {
  return rol === "asesor" || rol === "admin_nucleo";
}

export function esLocalComunicaciones(rol: string | null | undefined): boolean {
  return rol === "jefe_local" || rol === "admin_local";
}

export function transicionTicket(estadoActual: string, accion: AccionTicket): TicketEstado | null {
  if (accion === "atender") {
    return estadoActual === "abierta" ? "en_atencion" : null;
  }
  if (accion === "resolver") {
    return estadoActual === "resuelta" ? null : "resuelta";
  }
  if (accion === "reabrir") {
    return estadoActual === "resuelta" ? "abierta" : null;
  }
  return null;
}

/** Si el local responde una petición ya resuelta, vuelve a abierta. */
export function estadoTrasRespuesta(args: {
  estadoActual: string;
  respondeStaff: boolean;
}): TicketEstado | null {
  if (args.respondeStaff) {
    return args.estadoActual === "abierta" ? "en_atencion" : null;
  }
  return args.estadoActual === "resuelta" ? "abierta" : null;
}

export function destinatariosNuevaPeticion(args: {
  autorId: string;
  asesorId: string | null;
  adminNucleoIds: string[];
}): string[] {
  const ids = new Set<string>();
  if (args.asesorId) ids.add(args.asesorId);
  for (const id of args.adminNucleoIds) ids.add(id);
  ids.delete(args.autorId);
  return [...ids];
}

export function destinatariosRespuesta(args: {
  autorId: string;
  asignadoId: string | null;
  adminNucleoIds: string[];
  remitenteId: string;
  respondeStaff: boolean;
}): string[] {
  const ids = new Set<string>();
  if (args.respondeStaff) {
    ids.add(args.autorId);
  } else {
    if (args.asignadoId) ids.add(args.asignadoId);
    for (const id of args.adminNucleoIds) ids.add(id);
  }
  ids.delete(args.remitenteId);
  return [...ids];
}
