"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2, IconSend } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO,
  esStaffNucleo,
  type TicketCategoria,
  type TicketEstado,
} from "@/lib/comunicaciones/tickets";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState("");
  const esStaff = esStaffNucleo(userRole);

  const { data: ticket, isLoading } = trpc.comunicaciones.getTicket.useQuery({ id: ticketId });

  const responder = trpc.comunicaciones.responder.useMutation({
    onSuccess: () => {
      setContenido("");
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  function handleResponder(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    responder.mutate({ ticketId, contenido });
  }

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-xl border border-[#DDE3EA] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#0B1B33]">{ticket.asunto}</h2>
              {ticket.prioridad === "urgente" && (
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#B42318]">Urgente</span>
              )}
            </div>
            <p className="text-sm text-[#5B6980] mt-1">
              {ticket.tenant.nombre} · {ticket.autor.nombre} ·{" "}
              {ETIQUETA_CATEGORIA[ticket.categoria as TicketCategoria] ?? ticket.categoria}
            </p>
          </div>
          <BadgeEstado estado={ticket.estado} />
        </div>

        {esStaff && (
          <div className="flex flex-wrap gap-2 mt-4">
            {ticket.estado === "abierta" && (
              <button
                type="button"
                disabled={cambiar.isPending}
                onClick={() => cambiar.mutate({ ticketId, accion: "atender" })}
                className="min-h-10 px-4 rounded-lg bg-[#0B1B33] text-sm font-medium text-white hover:bg-[#16294A] disabled:opacity-60"
              >
                Atender
              </button>
            )}
            {ticket.estado !== "resuelta" && (
              <button
                type="button"
                disabled={cambiar.isPending}
                onClick={() => cambiar.mutate({ ticketId, accion: "resolver" })}
                className="min-h-10 px-4 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] disabled:opacity-60"
              >
                Marcar resuelta
              </button>
            )}
            {ticket.estado === "resuelta" && (
              <button
                type="button"
                disabled={cambiar.isPending}
                onClick={() => cambiar.mutate({ ticketId, accion: "reabrir" })}
                className="min-h-10 px-4 rounded-lg border border-[#DDE3EA] text-sm font-medium text-[#0B1B33] hover:border-[#0B1B33] disabled:opacity-60"
              >
                Reabrir
              </button>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-[#DDE3EA] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px] max-h-[50vh]">
          {ticket.mensajes.map((mensaje) => {
            const propio = mensaje.de === userId;
            const nombre = mensaje.remitente.nombre || mensaje.remitente.email;
            return (
              <div key={mensaje.id} className={`flex ${propio ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${propio ? "items-end" : "items-start"} flex flex-col`}>
                  <span className="text-xs font-medium text-[#5B6980] mb-1 px-1">
                    {nombre} · {formatFechaHora(mensaje.created_at)}
                  </span>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      propio ? "bg-[#16294A] text-white rounded-br-sm" : "bg-[#F4F6F3] text-[#0B1B33] rounded-bl-sm"
                    }`}
                  >
                    {mensaje.contenido}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleResponder} className="border-t border-[#DDE3EA] p-4 space-y-2">
          <label htmlFor="respuesta" className="sr-only">
            Respuesta
          </label>
          <textarea
            id="respuesta"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={ticket.estado === "resuelta" && !esStaff ? "Si necesitas retomar esto, escribe y la petición se reabre." : "Escribe una respuesta…"}
            className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
          />
          {error && <p className="text-sm text-[#B42318]">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={responder.isPending || contenido.trim().length === 0}
              className="inline-flex items-center gap-2 min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] disabled:opacity-60"
            >
              <IconSend size={16} />
              {responder.isPending ? "Enviando…" : "Responder"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
