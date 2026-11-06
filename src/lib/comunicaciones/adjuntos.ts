export const MAX_ADJUNTOS_PETICION = 8;
export const MAX_ADJUNTOS_MENSAJE = 4;

export type MensajeConAdjuntos = {
  adjuntos?: string[] | null;
  adjunto_url?: string | null;
};

export function adjuntosDeMensaje(mensaje: MensajeConAdjuntos): string[] {
  const lista = [...(mensaje.adjuntos ?? [])];
  if (mensaje.adjunto_url && !lista.includes(mensaje.adjunto_url)) {
    lista.push(mensaje.adjunto_url);
  }
  return lista.filter((ruta) => ruta.length > 0);
}

export function evidenciasPeticion(ticket: {
  adjuntos?: string[] | null;
  mensajes: MensajeConAdjuntos[];
}): string[] {
  const visto = new Set<string>();
  const orden: string[] = [];
  for (const ruta of [...(ticket.adjuntos ?? []), ...ticket.mensajes.flatMap(adjuntosDeMensaje)]) {
    if (!visto.has(ruta)) {
      visto.add(ruta);
      orden.push(ruta);
    }
  }
  return orden;
}

export function nombreArchivoPeticion(ruta: string): string {
  const archivo = ruta.split("/").pop() ?? "archivo";
  return archivo.replace(/^\d+-/, "");
}
