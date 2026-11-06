"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2, IconSend } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import { ArchivosAdjuntos, type ArchivoSubido } from "@/components/ui/ArchivosAdjuntos";
import { CasillaDeclaracion } from "@/components/declaraciones/CasillaDeclaracion";
import { ConstanciaDeRecurso } from "@/components/declaraciones/ConstanciaDeRecurso";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO,
  ETIQUETA_PRIORIDAD,
  esLocalComunicaciones,
  esStaffNucleo,
  type TicketCategoria,
  type TicketEstado,
} from "@/lib/comunicaciones/tickets";
import { adjuntosDeMensaje, evidenciasPeticion, MAX_ADJUNTOS_MENSAJE } from "@/lib/comunicaciones/adjuntos";
import { ETIQUETA_ROL } from "@/lib/roles";
import { EvidenciaPeticion } from "../EvidenciaPeticion";

function formatFechaHora(date: Date | string) {
  return new Date(date).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BadgeEstado({ estado }: { estado: string }) {
  const clase =
    estado === "resuelta"
      ? "bg-[#E5F1E3] text-[#255620]"
      : estado === "en_atencion"
        ? "bg-amber-50 text-amber-800"
        : "bg-red-50 text-[#991B1B]";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${clase}`}>
      {ETIQUETA_ESTADO[estado as TicketEstado] ?? estado}
    </span>
  );
}

export function TicketThread({ ticketId, userId, userRole }: { ticketId: string; userId: string; userRole: string | null }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const actividadRef = useRef<HTMLDivElement>(null);
  const [contenido, setContenido] = useState("");
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [aceptaB, setAceptaB] = useState(false);
  const [error, setError] = useState("");
  const esStaff = esStaffNucleo(userRole);
  const esLocal = esLocalComunicaciones(userRole);

  const { data: ticket, isLoading } = trpc.comunicaciones.getTicket.useQuery({ id: ticketId });

  const responder = trpc.comunicaciones.responder.useMutation({
    onSuccess: () => {
      setContenido("");
      setArchivos([]);
      setAceptaB(false);
      void utils.comunicaciones.getTicket.invalidate({ id: ticketId });
      void utils.comunicaciones.listTickets.invalidate();
      void utils.comunicaciones.resumen.invalidate();
      void utils.comunicaciones.contadorNoLeidos.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const cambiar = trpc.comunicaciones.cambiarEstado.useMutation({
    onSuccess: () => {
      void utils.comunicaciones.getTicket.invalidate({ id: ticketId });
      void utils.comunicaciones.listTickets.invalidate();
      void utils.comunicaciones.resumen.invalidate();
      void utils.comunicaciones.contadorNoLeidos.invalidate();
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  useEffect(() => {
    actividadRef.current?.scrollTo({ top: actividadRef.current.scrollHeight, behavior: "smooth" });
  }, [ticket?.mensajes.length]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#DDE3EA] p-12 flex justify-center">
        <IconLoader2 size={24} className="animate-spin text-[#2F6B2A]" />
      </div>
    );
  }

  if (!ticket) {
    return <p className="text-sm text-[#5B6980]">No encontramos esa petición.</p>;
  }

  const apertura = ticket.mensajes[0];
  const respuestas = ticket.mensajes.slice(1);
  const evidencias = evidenciasPeticion(ticket);
  const requiereB = esLocal && archivos.length > 0;
  const puedeEnviar =
    (contenido.trim().length > 0 || archivos.length > 0) && (!requiereB || aceptaB) && !responder.isPending;

  function handleResponder(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    responder.mutate({
      ticketId,
      contenido,
      adjuntos: archivos.map((archivo) => archivo.ruta),
      ...(requiereB ? { acepta_declaracion_b: true } : {}),
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] items-start">
      <div className="space-y-4 min-w-0">
        <section className="bg-white rounded-xl border border-[#DDE3EA] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#0B1B33]">{ticket.asunto}</h1>
                {ticket.prioridad === "urgente" && (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#B42318]">Urgente</span>
                )}
              </div>
              <p className="text-sm text-[#5B6980] mt-1">
                {ticket.tenant.nombre} · {ETIQUETA_CATEGORIA[ticket.categoria as TicketCategoria] ?? ticket.categoria}
              </p>
            </div>
            <BadgeEstado estado={ticket.estado} />
          </div>
        </section>

        {apertura && (
          <section className="bg-white rounded-xl border border-[#DDE3EA] p-5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Detalle</p>
            <p className="text-sm text-[#334155] mt-2 whitespace-pre-wrap leading-relaxed">{apertura.contenido}</p>
            <p className="text-xs text-[#5B6980] mt-3">
              {apertura.remitente.nombre || apertura.remitente.email} · {formatFechaHora(apertura.created_at)}
            </p>
          </section>
        )}

        <section className="bg-white rounded-xl border border-[#DDE3EA] p-5 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Evidencia</p>
            <span className="text-xs font-medium text-[#5B6980]">
              {evidencias.length === 0 ? "Sin archivos" : `${evidencias.length} archivo${evidencias.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {evidencias.length === 0 ? (
            <p className="text-sm text-[#5B6980]">
              Adjunta fotos o PDF en la respuesta: actas, pantallazos o certificados del caso.
            </p>
          ) : (
            <>
              <EvidenciaPeticion rutas={evidencias} />
              <ConstanciaDeRecurso recursoTipo="ticket" recursoId={ticket.id} />
            </>
          )}
        </section>

        <section className="bg-white rounded-xl border border-[#DDE3EA] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#DDE3EA]">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Actividad</p>
          </div>
          <div ref={actividadRef} className="max-h-[36vh] overflow-y-auto px-5 py-4">
            {respuestas.length === 0 ? (
              <p className="text-sm text-[#5B6980]">Aún no hay respuestas. El hilo queda acá, no ocupa toda la pantalla.</p>
            ) : (
              <ol className="space-y-4">
                {respuestas.map((mensaje) => {
                  const propio = mensaje.de === userId;
                  const nombre = mensaje.remitente.nombre || mensaje.remitente.email;
                  const rol = ETIQUETA_ROL[mensaje.remitente.rol]?.label ?? mensaje.remitente.rol;
                  const archivosMensaje = adjuntosDeMensaje(mensaje);
                  return (
                    <li key={mensaje.id} className="grid grid-cols-[12px_1fr] gap-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${propio ? "bg-[#2F6B2A]" : "bg-[#16294A]"}`} />
                      <div>
                        <p className="text-xs font-medium text-[#5B6980]">
                          {nombre} · {rol} · {formatFechaHora(mensaje.created_at)}
                        </p>
                        <p className="text-sm text-[#0B1B33] mt-1 whitespace-pre-wrap leading-relaxed">{mensaje.contenido}</p>
                        {archivosMensaje.length > 0 && (
                          <div className="mt-2">
                            <EvidenciaPeticion rutas={archivosMensaje} compacto />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <form onSubmit={handleResponder} className="border-t border-[#DDE3EA] p-4 space-y-3">
            <label htmlFor="respuesta" className="sr-only">
              Respuesta
            </label>
            <textarea
              id="respuesta"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={
                ticket.estado === "resuelta" && !esStaff
                  ? "Si necesitas retomar esto, escribe o adjunta evidencia y la petición se reabre."
                  : "Escribe una actualización. Puedes adjuntar fotos o PDF."
              }
              className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
            />
            <ArchivosAdjuntos
              bucket="documentos"
              valor={archivos}
              onCambio={setArchivos}
              maximo={MAX_ADJUNTOS_MENSAJE}
              etiqueta="Adjuntar evidencia"
            />
            {requiereB && <CasillaDeclaracion tipo="B" checked={aceptaB} onChange={setAceptaB} />}
            {error && <p className="text-sm text-[#B42318]">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!puedeEnviar}
                className="inline-flex items-center gap-2 min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] disabled:opacity-60"
              >
                <IconSend size={16} />
                {responder.isPending ? "Enviando…" : "Enviar actualización"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-4">
        <section className="bg-white rounded-xl border border-[#DDE3EA] p-5 space-y-3">
          <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Ficha</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-[#5B6980]">Estado</dt>
              <dd className="mt-1">
                <BadgeEstado estado={ticket.estado} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5B6980]">Tipo</dt>
              <dd className="font-medium text-[#0B1B33]">{ETIQUETA_CATEGORIA[ticket.categoria as TicketCategoria] ?? ticket.categoria}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#5B6980]">Prioridad</dt>
              <dd className="font-medium text-[#0B1B33]">{ETIQUETA_PRIORIDAD[ticket.prioridad as "normal" | "urgente"] ?? ticket.prioridad}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#5B6980]">Local</dt>
              <dd className="font-medium text-[#0B1B33]">{ticket.tenant.nombre}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#5B6980]">Solicitante</dt>
              <dd className="font-medium text-[#0B1B33]">{ticket.autor.nombre || ticket.autor.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#5B6980]">Asignado</dt>
              <dd className="font-medium text-[#0B1B33]">{ticket.asignado?.nombre ?? "Sin asignar"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#5B6980]">Abierta</dt>
              <dd className="font-medium text-[#0B1B33]">{formatDate(ticket.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#5B6980]">Actualizada</dt>
              <dd className="font-medium text-[#0B1B33]">{formatDate(ticket.updated_at)}</dd>
            </div>
          </dl>
        </section>

        {esStaff && (
          <section className="bg-white rounded-xl border border-[#DDE3EA] p-5 space-y-2">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Acciones</p>
            {ticket.estado === "abierta" && (
              <button
                type="button"
                disabled={cambiar.isPending}
                onClick={() => cambiar.mutate({ ticketId, accion: "atender" })}
                className="w-full min-h-11 px-4 rounded-lg bg-[#0B1B33] text-sm font-medium text-white hover:bg-[#16294A] disabled:opacity-60"
              >
                Tomar petición
              </button>
            )}
            {ticket.estado !== "resuelta" && (
              <button
                type="button"
                disabled={cambiar.isPending}
                onClick={() => cambiar.mutate({ ticketId, accion: "resolver" })}
                className="w-full min-h-11 px-4 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] disabled:opacity-60"
              >
                Marcar resuelta
              </button>
            )}
            {ticket.estado === "resuelta" && (
              <button
                type="button"
                disabled={cambiar.isPending}
                onClick={() => cambiar.mutate({ ticketId, accion: "reabrir" })}
                className="w-full min-h-11 px-4 rounded-lg border border-[#DDE3EA] text-sm font-medium text-[#0B1B33] hover:border-[#0B1B33] disabled:opacity-60"
              >
                Reabrir
              </button>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}
