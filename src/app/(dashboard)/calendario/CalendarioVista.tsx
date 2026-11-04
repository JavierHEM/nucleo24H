"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { TIPO_EVENTO_LABEL, type EventoCalendario, type TipoEvento } from "@/lib/calendario";
import { formatDate } from "@/lib/utils";
import { NuevaVisitaButton } from "../visitas/NuevaVisitaButton";
import { AgendarVisitaDialogo } from "./AgendarVisitaDialogo";

const COLOR_TIPO: Record<TipoEvento, string> = {
  visita: "bg-[#16294A] text-white",
  documento: "bg-[#E5F1E3] text-[#255620]",
  cobro: "bg-[#FFF8E6] text-[#5B3B00]",
  contrato: "bg-[#FFF8E6] text-[#5B3B00]",
  no_conformidad: "bg-[#FCE4E1] text-[#9A1C12]",
  ambiental: "bg-[#E5F1E3] text-[#255620]",
};

function mesDe(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

function agruparPorMes(eventos: EventoCalendario[]) {
  const grupos = new Map<string, EventoCalendario[]>();
  for (const evento of eventos) {
    const clave = mesDe(new Date(evento.fecha));
    grupos.set(clave, [...(grupos.get(clave) ?? []), evento]);
  }
  return [...grupos.entries()];
}

export function CalendarioVista({ tenantId, puedeAgendar }: { tenantId: string | null; puedeAgendar: boolean }) {
  const [agendando, setAgendando] = useState(false);
  const utils = trpc.useUtils();
  const consulta = trpc.calendario.eventos.useQuery();
  const cancelar = trpc.visitas.cancelarAgendada.useMutation({
    onSuccess: () => utils.calendario.eventos.invalidate(),
  });

  if (consulta.isLoading) return <p className="text-sm text-[#5B6980]">Cargando calendario…</p>;
  if (consulta.error || !consulta.data) {
    return (
      <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2">
        {consulta.error?.message ?? "No pudimos cargar el calendario."}
      </p>
    );
  }

  const eventos = consulta.data.eventos.map((evento) => ({ ...evento, fecha: new Date(evento.fecha) }));
  const agendadas = consulta.data.visitasAgendadas;
  const grupos = agruparPorMes(eventos);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Calendario</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Visitas, vencimientos de documentos, plazos y fechas del contrato en un solo lugar.
          </p>
        </div>
        {puedeAgendar && tenantId && (
          <Button onClick={() => setAgendando(true)} className="bg-[#2F6B2A] hover:bg-[#255620] text-white">
            Agendar visita
          </Button>
        )}
      </div>

      {puedeAgendar && agendadas.length > 0 && tenantId && (
        <section className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DDE3EA] bg-[#F4F6F3]">
            <h2 className="text-sm font-semibold text-[#0B1B33]">Visitas agendadas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#5B6980]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3EA]">
                {agendadas.map((visita) => (
                  <tr key={visita.id} className="hover:bg-[#F4F6F3] transition-colors">
                    <td className="px-4 py-3 text-[#5B6980] whitespace-nowrap">
                      {formatDate(new Date(visita.fecha))}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#0B1B33]">
                      {visita.tipo === "sorpresa" ? "Visita sorpresa" : "Visita programada"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <NuevaVisitaButton
                          tenantId={tenantId}
                          agendadaId={visita.id}
                          tipoInicial={visita.tipo === "sorpresa" ? "sorpresa" : "programada"}
                          etiqueta="Completar"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={cancelar.isPending}
                          onClick={() => {
                            if (window.confirm("¿Cancelar esta visita agendada?")) cancelar.mutate({ id: visita.id });
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cancelar.error && <p className="px-4 py-3 text-sm text-[#B42318]">{cancelar.error.message}</p>}
        </section>
      )}

      {grupos.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-[#DDE3EA] bg-white p-10 text-center text-sm text-[#5B6980]">
          No hay eventos próximos.
        </p>
      ) : (
        grupos.map(([mes, items]) => (
          <section key={mes} className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DDE3EA] bg-[#F4F6F3]">
              <h2 className="font-mono text-xs uppercase tracking-wide text-[#5B6980]">{mes}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Evento</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">
                      Detalle
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3EA]">
                  {items.map((evento) => (
                    <tr key={evento.id} className="hover:bg-[#F4F6F3] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-mono text-sm font-semibold text-[#0B1B33]">
                          {evento.fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {evento.href ? (
                          <Link
                            href={evento.href}
                            className="font-medium text-[#0B1B33] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
                          >
                            {evento.titulo}
                          </Link>
                        ) : (
                          <p className="font-medium text-[#0B1B33]">{evento.titulo}</p>
                        )}
                        {evento.vencido && <p className="text-xs font-medium text-[#B42318]">Plazo vencido</p>}
                      </td>
                      <td className="px-4 py-3 text-[#5B6980] hidden md:table-cell">{evento.detalle || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${COLOR_TIPO[evento.tipo]}`}
                        >
                          {TIPO_EVENTO_LABEL[evento.tipo]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      {puedeAgendar && tenantId && (
        <AgendarVisitaDialogo abierto={agendando} tenantId={tenantId} onCerrar={() => setAgendando(false)} />
      )}
    </div>
  );
}
