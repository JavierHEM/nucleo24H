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
    <div className="space-y-6 max-w-3xl">
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
        <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#0B1B33]">Visitas agendadas</h2>
          <ul className="mt-2 divide-y divide-[#F1F5F9]">
            {agendadas.map((visita) => (
              <li key={visita.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0B1B33]">
                    {visita.tipo === "sorpresa" ? "Visita sorpresa" : "Visita programada"}
                  </p>
                  <p className="text-xs text-[#5B6980]">{formatDate(new Date(visita.fecha))}</p>
                </div>
                <div className="flex items-center gap-2">
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
              </li>
            ))}
          </ul>
          {cancelar.error && <p className="mt-2 text-sm text-[#B42318]">{cancelar.error.message}</p>}
        </section>
      )}

      {grupos.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-[#DDE3EA] bg-white p-10 text-center text-sm text-[#5B6980]">
          No hay eventos próximos.
        </p>
      ) : (
        grupos.map(([mes, items]) => (
          <section key={mes}>
            <h2 className="font-mono text-xs uppercase tracking-wide text-[#5B6980] mb-2">{mes}</h2>
            <ul className="rounded-xl border border-[#DDE3EA] bg-white divide-y divide-[#F1F5F9]">
              {items.map((evento) => {
                const contenido = (
                  <div className="flex items-start gap-4 px-4 py-3">
                    <div className="w-12 shrink-0 text-center">
                      <p className="font-mono text-xl font-semibold leading-none text-[#0B1B33]">{evento.fecha.getDate()}</p>
                      <p className="font-mono text-[11px] uppercase text-[#5B6980]">
                        {evento.fecha.toLocaleDateString("es-CL", { month: "short" })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0B1B33]">{evento.titulo}</p>
                      {evento.detalle && <p className="text-xs text-[#5B6980] truncate">{evento.detalle}</p>}
                      {evento.vencido && <p className="text-xs font-medium text-[#B42318]">Plazo vencido</p>}
                    </div>
                    <span className={`shrink-0 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${COLOR_TIPO[evento.tipo]}`}>
                      {TIPO_EVENTO_LABEL[evento.tipo]}
                    </span>
                  </div>
                );
                return (
                  <li key={evento.id}>
                    {evento.href ? (
                      <Link href={evento.href} className="block hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F6B2A]">
                        {contenido}
                      </Link>
                    ) : (
                      contenido
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {puedeAgendar && tenantId && (
        <AgendarVisitaDialogo abierto={agendando} tenantId={tenantId} onCerrar={() => setAgendando(false)} />
      )}
    </div>
  );
}
