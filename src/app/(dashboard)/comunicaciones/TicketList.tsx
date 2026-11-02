"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMessage2, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO,
  esStaffNucleo,
  type TicketCategoria,
  type TicketEstado,
} from "@/lib/comunicaciones/tickets";

const FILTROS = [
  { id: "pendientes", label: "Pendientes" },
  { id: "abierta", label: "Abiertas" },
  { id: "en_atencion", label: "En atención" },
  { id: "resuelta", label: "Resueltas" },
  { id: "todas", label: "Todas" },
] as const;

type Filtro = (typeof FILTROS)[number]["id"];

function BadgeEstado({ estado }: { estado: string }) {
  const clase =
    estado === "resuelta"
      ? "bg-[#E5F1E3] text-[#255620]"
      : estado === "en_atencion"
        ? "bg-amber-50 text-amber-800"
        : "bg-red-50 text-[#991B1B]";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${clase}`}>
      {ETIQUETA_ESTADO[estado as TicketEstado] ?? estado}
    </span>
  );
}

export function TicketList({ userRole }: { userRole: string | null }) {
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const esStaff = esStaffNucleo(userRole);
  const { data: tickets, isLoading } = trpc.comunicaciones.listTickets.useQuery({ estado: filtro, limit: 80 });
  const { data: resumen } = trpc.comunicaciones.resumen.useQuery();

  const scores = (
    <ScoreCards
      items={[
        { label: "Abiertas", value: resumen?.abiertas ?? 0, hint: "Sin atender", tone: (resumen?.abiertas ?? 0) > 0 ? "alerta" : "ok" },
        { label: "En atención", value: resumen?.enAtencion ?? 0, hint: "Núcleo trabajando", tone: "neutral" },
        { label: "Resueltas", value: resumen?.resueltas ?? 0, hint: "Cerradas", tone: "ok" },
      ]}
    />
  );

  return (
    <div className="space-y-4">
      {scores}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            className={`min-h-10 px-3 rounded-lg text-sm font-semibold border ${
              filtro === item.id
                ? "bg-[#0B1B33] text-white border-[#0B1B33]"
                : "bg-white text-[#41506A] border-[#DDE3EA] hover:border-[#0B1B33]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#DDE3EA] p-12 flex justify-center">
          <IconLoader2 size={24} className="animate-spin text-[#2F6B2A]" />
        </div>
      ) : !tickets || tickets.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#E5F1E3] flex items-center justify-center mx-auto mb-3">
            <IconMessage2 size={24} className="text-[#2F6B2A]" />
          </div>
          <p className="font-semibold text-[#0B1B33]">No hay peticiones aquí</p>
          <p className="text-sm text-[#5B6980] mt-1">
            {esStaff
              ? "Cuando un local envíe una petición, aparece en esta lista."
              : "Usa “Nueva petición” para escribirle a Núcleo."}
          </p>
        </div>
      ) : (
        <ul className="bg-white rounded-xl border border-[#DDE3EA] divide-y divide-[#F1F5F9] overflow-hidden">
          {tickets.map((ticket) => {
            const ultimo = ticket.mensajes[0];
            return (
              <li key={ticket.id}>
                <Link
                  href={`/comunicaciones/${ticket.id}`}
                  className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F6B2A]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#0B1B33]">{ticket.asunto}</p>
                      {ticket.prioridad === "urgente" && (
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#B42318]">Urgente</span>
                      )}
                    </div>
                    <p className="text-sm text-[#5B6980] mt-0.5">
                      {esStaff ? ticket.tenant.nombre : ticket.asignado?.nombre ?? "Núcleo 24H"}
                      {" · "}
                      {ETIQUETA_CATEGORIA[ticket.categoria as TicketCategoria] ?? ticket.categoria}
                      {" · "}
                      {formatDate(ticket.updated_at)}
                    </p>
                    {ultimo && (
                      <p className="text-sm text-[#334155] mt-1.5 line-clamp-1 max-w-xl">{ultimo.contenido}</p>
                    )}
                  </div>
                  <BadgeEstado estado={ticket.estado} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
