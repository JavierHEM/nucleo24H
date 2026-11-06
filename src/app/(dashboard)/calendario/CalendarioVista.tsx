"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  agruparPorDia,
  celdasDelMes,
  claveDia,
  desplazarMes,
  DIAS_SEMANA,
  etiquetaMes,
  mesISO,
  parseMes,
  TIPO_EVENTO_LABEL,
  type EventoCalendario,
  type TipoEvento,
} from "@/lib/calendario";
import { NuevaVisitaButton } from "../visitas/NuevaVisitaButton";
import { AgendarVisitaDialogo } from "./AgendarVisitaDialogo";
import { type MotivoVisita } from "@/lib/bpm/visita";
import { cambiarLocalActivo } from "@/lib/locales/cambiarLocal";

const COLOR_TIPO: Record<TipoEvento, string> = {
  visita: "bg-[#16294A] text-white",
  documento: "bg-[#E5F1E3] text-[#255620]",
  cobro: "bg-[#FFF8E6] text-[#5B3B00]",
  contrato: "bg-[#FFF8E6] text-[#5B3B00]",
  no_conformidad: "bg-[#FCE4E1] text-[#9A1C12]",
  ambiental: "bg-[#E5F1E3] text-[#255620]",
  hallazgo: "bg-[#FCE4E1] text-[#9A1C12]",
  fiscalizacion: "bg-[#16294A] text-white",
  descargo: "bg-[#FFF8E6] text-[#5B3B00]",
};

const PUNTO_TIPO: Record<TipoEvento, string> = {
  visita: "bg-[#16294A]",
  documento: "bg-[#2F6B2A]",
  cobro: "bg-[#E3B341]",
  contrato: "bg-[#E3B341]",
  no_conformidad: "bg-[#B42318]",
  ambiental: "bg-[#2F6B2A]",
  hallazgo: "bg-[#B42318]",
  fiscalizacion: "bg-[#16294A]",
  descargo: "bg-[#E3B341]",
};

const LEYENDA: { tipo: TipoEvento; label: string }[] = [
  { tipo: "visita", label: "Visita" },
  { tipo: "hallazgo", label: "Hallazgo" },
  { tipo: "fiscalizacion", label: "Fiscalización" },
  { tipo: "descargo", label: "Descargo" },
  { tipo: "documento", label: "Documento" },
  { tipo: "no_conformidad", label: "No conformidad" },
];

const MAX_CHIPS = 3;

export function CalendarioVista({ tenantId, puedeAgendar }: { tenantId: string | null; puedeAgendar: boolean }) {
  const hoyClave = claveDia(new Date());
  const actual = parseMes(undefined, new Date());
  const [anio, setAnio] = useState(actual.anio);
  const [mes, setMes] = useState(actual.mes);
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyClave);
  const [agendando, setAgendando] = useState(false);
  const [fechaAgenda, setFechaAgenda] = useState(hoyClave);
  const utils = trpc.useUtils();
  const consulta = trpc.calendario.eventos.useQuery({ mes: mesISO(anio, mes) });
  const cancelar = trpc.visitas.cancelarAgendada.useMutation({
    onSuccess: () => utils.calendario.eventos.invalidate(),
  });

  const celdas = useMemo(() => celdasDelMes(anio, mes), [anio, mes]);
  const eventos = useMemo(
    () => (consulta.data?.eventos ?? []).map((evento) => ({ ...evento, fecha: new Date(evento.fecha) })),
    [consulta.data?.eventos]
  );
  const porDia = useMemo(() => agruparPorDia(eventos), [eventos]);
  const agendadas = consulta.data?.visitasAgendadas ?? [];
  const delDia = porDia.get(diaSeleccionado) ?? [];

  function irAlMes(delta: number) {
    const siguiente = desplazarMes(anio, mes, delta);
    setAnio(siguiente.anio);
    setMes(siguiente.mes);
    const hoy = parseMes(undefined, new Date());
    if (siguiente.anio === hoy.anio && siguiente.mes === hoy.mes) setDiaSeleccionado(hoyClave);
    else setDiaSeleccionado(mesISO(siguiente.anio, siguiente.mes) + "-01");
  }

  function abrirAgenda(clave: string) {
    setFechaAgenda(clave);
    setAgendando(true);
  }

  if (consulta.error) {
    return (
      <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2">
        {consulta.error.message ?? "No pudimos cargar el calendario."}
      </p>
    );
  }

  return (
    <div className="space-y-5 w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Calendario</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            {puedeAgendar
              ? "Visitas, hallazgos, fiscalizaciones y descargos de todos tus locales."
              : "Hallazgos, fiscalizaciones, descargos, visitas y vencimientos del local."}
          </p>
        </div>
        {puedeAgendar && tenantId && (
          <Button onClick={() => abrirAgenda(diaSeleccionado)} className="bg-[#2F6B2A] hover:bg-[#255620] text-white">
            Agendar visita
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3">
          <button
            type="button"
            onClick={() => irAlMes(-1)}
            className="w-11 h-11 rounded-lg flex items-center justify-center text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
            aria-label="Mes anterior"
          >
            <IconChevronLeft size={20} />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-[#0B1B33] tabular-nums">{etiquetaMes(anio, mes)}</h2>
          <button
            type="button"
            onClick={() => irAlMes(1)}
            className="w-11 h-11 rounded-lg flex items-center justify-center text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
            aria-label="Mes siguiente"
          >
            <IconChevronRight size={20} />
          </button>
        </div>

        <div className="cal-scroll">
          <div className="cal-grilla" role="grid" aria-label={etiquetaMes(anio, mes)}>
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="cal-dow" role="columnheader">
                {dia}
              </div>
            ))}
            {celdas.map((celda) => {
              const items = porDia.get(celda.clave) ?? [];
              const seleccionado = celda.clave === diaSeleccionado;
              const esHoy = celda.clave === hoyClave;
              const visibles = items.slice(0, MAX_CHIPS);
              const resto = items.length - visibles.length;
              return (
                <button
                  key={celda.clave}
                  type="button"
                  role="gridcell"
                  onClick={() => setDiaSeleccionado(celda.clave)}
                  onDoubleClick={() => puedeAgendar && abrirAgenda(celda.clave)}
                  aria-pressed={seleccionado}
                  aria-current={esHoy ? "date" : undefined}
                  data-fuera={celda.fuera ? "true" : "false"}
                  aria-label={`${celda.dia}${items.length > 0 ? `, ${items.length} evento${items.length === 1 ? "" : "s"}` : ""}`}
                  className="cal-celda"
                >
                  <span className="cal-num">{celda.dia}</span>
                  <span className="cal-eventos">
                    {visibles.map((evento) => (
                      <span key={evento.id} className="cal-evento" data-tipo={evento.tipo} title={evento.titulo}>
                        {evento.titulo}
                      </span>
                    ))}
                    {resto > 0 ? <span className="cal-mas">+{resto} más</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 px-3 sm:px-4 py-2 border-t border-[#DDE3EA] bg-[#F8F9F8]">
          {LEYENDA.map((item) => (
            <li key={item.tipo} className="flex items-center gap-1.5 text-[11px] text-[#5B6980]">
              <span className={`h-2 w-2 rounded-full ${PUNTO_TIPO[item.tipo]}`} aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <section className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#0B1B33]">
            {new Date(`${diaSeleccionado}T12:00:00`).toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          {puedeAgendar && tenantId && (
            <Button type="button" variant="outline" size="sm" onClick={() => abrirAgenda(diaSeleccionado)}>
              Agendar este día
            </Button>
          )}
        </div>

        {consulta.isLoading ? (
          <p className="text-sm text-[#5B6980]">Cargando eventos…</p>
        ) : delDia.length === 0 ? (
          <p className="text-sm text-[#5B6980]">No hay eventos este día.</p>
        ) : (
          <ul className="space-y-2">
            {delDia.map((evento) => (
              <EventoDelDia
                key={evento.id}
                evento={evento}
                visita={agendadas.find((item) => item.id === evento.visita_id)}
                tenantId={tenantId}
                puedeAgendar={puedeAgendar}
                cancelando={cancelar.isPending}
                onCancelar={(id) => {
                  if (window.confirm("¿Cancelar esta visita agendada?")) cancelar.mutate({ id });
                }}
              />
            ))}
          </ul>
        )}
        {cancelar.error && <p className="text-sm text-[#B42318]">{cancelar.error.message}</p>}
      </section>

      {puedeAgendar && tenantId && (
        <AgendarVisitaDialogo
          abierto={agendando}
          tenantId={tenantId}
          fechaInicial={fechaAgenda}
          onCerrar={() => setAgendando(false)}
        />
      )}
    </div>
  );
}

function EventoDelDia({
  evento,
  visita,
  tenantId,
  puedeAgendar,
  cancelando,
  onCancelar,
}: {
  evento: EventoCalendario;
  visita?: {
    id: string;
    tipo: string;
    motivo: string | null;
    tenant_id: string;
    local: string;
    hallazgo_origen: { id: string; descripcion: string } | null;
  };
  tenantId: string | null;
  puedeAgendar: boolean;
  cancelando: boolean;
  onCancelar: (id: string) => void;
}) {
  const localId = visita?.tenant_id ?? evento.tenant_id ?? tenantId;

  return (
    <li className="rounded-xl border border-[#DDE3EA] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {evento.href ? (
            <EnlaceEvento href={evento.href} tenantEvento={evento.tenant_id} tenantActivo={tenantId}>
              {evento.titulo}
            </EnlaceEvento>
          ) : (
            <p className="font-medium text-[#0B1B33]">{evento.titulo}</p>
          )}
          {evento.detalle && <p className="text-xs text-[#5B6980] mt-0.5">{evento.detalle}</p>}
          {evento.vencido && <p className="text-xs font-medium text-[#B42318] mt-0.5">Plazo vencido</p>}
        </div>
        <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${COLOR_TIPO[evento.tipo]}`}>
          {TIPO_EVENTO_LABEL[evento.tipo]}
        </span>
      </div>
      {puedeAgendar && visita && localId && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <NuevaVisitaButton
            tenantId={localId}
            agendadaId={visita.id}
            tipoInicial={visita.tipo === "sorpresa" ? "sorpresa" : "programada"}
            motivoInicial={(visita.motivo as MotivoVisita) || "rutina"}
            hallazgoOrigen={visita.hallazgo_origen}
            etiqueta="Completar"
          />
          <Button type="button" size="sm" variant="outline" disabled={cancelando} onClick={() => onCancelar(visita.id)}>
            Cancelar
          </Button>
        </div>
      )}
    </li>
  );
}

function EnlaceEvento({
  href,
  tenantEvento,
  tenantActivo,
  children,
}: {
  href: string;
  tenantEvento?: string;
  tenantActivo: string | null;
  children: ReactNode;
}) {
  const clase = "font-medium text-[#0B1B33] underline-offset-2 hover:underline text-left";
  const otroLocal = Boolean(tenantEvento && tenantActivo && tenantEvento !== tenantActivo);
  if (!otroLocal) {
    return (
      <Link href={href} className={clase}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={clase}
      onClick={() => {
        void cambiarLocalActivo(tenantEvento!, href);
      }}
    >
      {children}
    </button>
  );
}
