"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";
import {
  ETIQUETA_CATEGORIA,
  TICKET_CATEGORIAS,
  type TicketCategoria,
} from "@/lib/comunicaciones/tickets";

export function NuevaPeticionButton() {
  const [abierto, setAbierto] = useState(false);
  const [asunto, setAsunto] = useState("");
  const [categoria, setCategoria] = useState<TicketCategoria>("consulta");
  const [urgente, setUrgente] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const utils = trpc.useUtils();

  const crear = trpc.comunicaciones.crearTicket.useMutation({
    onSuccess: (ticket) => {
      setAbierto(false);
      setAsunto("");
      setCategoria("consulta");
      setUrgente(false);
      setMensaje("");
      void utils.comunicaciones.listTickets.invalidate();
      void utils.comunicaciones.resumen.invalidate();
      router.push(`/comunicaciones/${ticket.id}`);
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    crear.mutate({
      asunto,
      categoria,
      prioridad: urgente ? "urgente" : "normal",
      mensaje,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setAbierto(true);
        }}
        className="inline-flex items-center gap-2 min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] focus-visible:ring-offset-2"
      >
        <IconPlus size={16} />
        Nueva petición
      </button>

      <Dialogo abierto={abierto} titulo="Nueva petición" onCerrar={() => setAbierto(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ticket-asunto" className="text-sm font-medium text-[#0B1B33] block mb-1.5">
              Asunto
            </label>
            <input
              id="ticket-asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label htmlFor="ticket-categoria" className="text-sm font-medium text-[#0B1B33] block mb-1.5">
              Tipo
            </label>
            <select
              id="ticket-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as TicketCategoria)}
              className="w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
            >
              {TICKET_CATEGORIAS.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {ETIQUETA_CATEGORIA[opcion]}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#0B1B33]">
            <input
              type="checkbox"
              checked={urgente}
              onChange={(e) => setUrgente(e.target.checked)}
              className="size-4 accent-[#2F6B2A]"
            />
            Marcar como urgente
          </label>

          <div>
            <label htmlFor="ticket-mensaje" className="text-sm font-medium text-[#0B1B33] block mb-1.5">
              Detalle
            </label>
            <textarea
              id="ticket-mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={5}
              maxLength={2000}
              className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
              required
            />
          </div>

          {error && <p className="text-sm text-[#B42318]">{error}</p>}

          <button
            type="submit"
            disabled={crear.isPending}
            className="w-full min-h-12 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] disabled:opacity-60"
          >
            {crear.isPending ? "Enviando…" : "Enviar petición"}
          </button>
        </form>
      </Dialogo>
    </>
  );
}
