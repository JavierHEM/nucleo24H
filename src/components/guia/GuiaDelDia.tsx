"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { IconPrinter, IconUpload } from "@tabler/icons-react";
import { PlanillaSheet } from "@/components/registros/PlanillaSheet";
import { CargarPlanillaSheet } from "@/app/(dashboard)/registros/CargarPlanillaSheet";
import { plantillaPorCodigo, urlOficial } from "@/lib/bpm/biblioteca";
import type { ItemAgenda, Momento } from "@/lib/bpm/programa";

const MOMENTO_LABEL: Record<Momento, string> = {
  inicio: "Al inicio",
  durante: "Durante el turno",
  cierre: "Al cierre",
};

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  hecho: "Listo",
  observacion: "Observación",
} as const;

function enlaceImpresion(codigo: string) {
  const plantilla = plantillaPorCodigo(codigo);
  const oficial = plantilla ? urlOficial(plantilla.path) : "#";
  if (plantilla && oficial !== "#") return { href: oficial, externo: true };
  return { href: `/registros/imprimir/${codigo}`, externo: false };
}

export function GuiaDelDia({ puedeCargar = false }: { puedeCargar?: boolean }) {
  const utils = trpc.useUtils();
  const agenda = trpc.programa.agenda.useQuery();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);

  const hoy = agenda.data?.hoy ?? [];
  const eventos = agenda.data?.eventos ?? [];
  const mes = agenda.data?.mes;
  const siguiente = hoy.find((item) => item.estado !== "hecho");
  const listos = hoy.filter((item) => item.estado === "hecho").length;
  const avance = hoy.length > 0 ? Math.round((listos / hoy.length) * 100) : 0;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0B1B33]">Hoy en el local</h2>
          <p className="text-sm text-[#5B6980] mt-0.5">
            {agenda.isLoading
              ? "Cargando la guía…"
              : hoy.length === 0
                ? "Tu asesor todavía no dejó controles de turno para este local."
                : siguiente
                  ? `${listos} de ${hoy.length} listos. Sigue con ${siguiente.nombre}.`
                  : "El turno de hoy está al día."}
          </p>
        </div>
      </div>

      {agenda.isLoading && <p className="text-sm text-[#5B6980]">Cargando la guía…</p>}
      {agenda.error && (
        <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2">{agenda.error.message}</p>
      )}

      {hoy.length > 0 && (
        <ScoreCards
          items={[
            { label: "Listos", value: `${listos}/${hoy.length}`, hint: `${avance}% del turno`, tone: listos === hoy.length ? "ok" : "neutral" },
            {
              label: "Pendientes",
              value: hoy.filter((item) => item.estado === "pendiente").length,
              hint: "Sin registrar",
              tone: hoy.some((item) => item.estado === "pendiente") ? "alerta" : "ok",
            },
            {
              label: "Con observación",
              value: hoy.filter((item) => item.estado === "observacion").length,
              hint: "Revisar la acción",
              tone: hoy.some((item) => item.estado === "observacion") ? "alerta" : "ok",
            },
            { label: "Si pasa", value: eventos.length, hint: "Solo si ocurre", tone: "neutral" },
          ]}
        />
      )}

      {(["inicio", "durante", "cierre"] as const).map((momento) => {
        const items = hoy.filter((item) => item.momento === momento);
        if (items.length === 0) return null;
        return (
          <div key={momento} className="space-y-2">
            <p className="font-mono text-[10px] tracking-wide text-[#5B6980]">{MOMENTO_LABEL[momento]}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <li key={item.codigo}>
                  <Tarjeta
                    item={item}
                    destacada={item.codigo === siguiente?.codigo}
                    onRegistrar={() => setCodigo(item.codigo)}
                    onPapel={() => setPapel(item.codigo)}
                    puedeCargar={puedeCargar}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {!agenda.isLoading && hoy.length === 0 && (
        <p className="text-sm text-[#5B6980] bg-white border border-[#DDE3EA] rounded-xl px-4 py-3">
          Tu asesor todavía no dejó controles de turno para este local.
        </p>
      )}

      {eventos.length > 0 && (
        <details className="bg-white rounded-xl border border-[#DDE3EA] group">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] rounded-xl">
            Si pasa algo en el turno
            <span className="ml-2 text-xs font-normal text-[#5B6980]">{eventos.length} registros</span>
          </summary>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-3 pb-3">
            {eventos.map((item) => (
              <li key={item.codigo}>
                <Tarjeta
                  item={item}
                  onRegistrar={() => setCodigo(item.codigo)}
                  onPapel={() => setPapel(item.codigo)}
                  puedeCargar={puedeCargar}
                  evento
                />
              </li>
            ))}
          </ul>
        </details>
      )}

      {mes && <ResumenMes mes={mes} />}

      <PlanillaSheet
        abierto={Boolean(codigo)}
        codigo={codigo}
        onCerrar={() => setCodigo(null)}
        onSuccess={() => utils.programa.agenda.invalidate()}
      />
      <CargarPlanillaSheet codigo={papel ?? undefined} abierto={Boolean(papel)} onCerrar={() => setPapel(null)} />
    </section>
  );
}

function Tarjeta({
  item,
  onRegistrar,
  onPapel,
  puedeCargar,
  destacada = false,
  evento = false,
}: {
  item: ItemAgenda;
  onRegistrar: () => void;
  onPapel: () => void;
  puedeCargar: boolean;
  destacada?: boolean;
  evento?: boolean;
}) {
  const listo = item.estado === "hecho";
  const impresion = enlaceImpresion(item.codigo);
  return (
    <article
      className={`h-full rounded-xl border bg-white p-3 flex flex-col gap-2 ${
        destacada ? "border-[#16294A]" : "border-[#DDE3EA]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm leading-snug ${listo ? "text-[#5B6980]" : "font-medium text-[#0B1B33]"}`}>
          {item.nombre}
        </p>
        <span
          className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
            listo ? "bg-[#2F6B2A]" : item.estado === "observacion" ? "bg-[#D97706]" : "bg-[#CBD5E1]"
          }`}
          aria-hidden
        />
      </div>
      <p className="text-xs text-[#5B6980]">{evento ? item.cuando : ESTADO_LABEL[item.estado]}</p>
      {destacada && <p className="text-xs text-[#334155] line-clamp-2">{item.porque}</p>}
      {item.detalle && <p className="text-xs text-[#B45309]">{item.detalle}</p>}
      <div className="mt-auto flex flex-col gap-1.5">
        {!listo && (
          <button
            type="button"
            onClick={onRegistrar}
            className={`min-h-9 rounded-lg text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
              destacada
                ? "bg-[#16294A] text-white hover:bg-[#0B1B33]"
                : "border border-[#DDE3EA] text-[#16294A] hover:bg-[#F4F6F3]"
            }`}
          >
            {destacada ? "Registrar ahora" : "Registrar"}
          </button>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          {puedeCargar && (
            <button
              type="button"
              onClick={onPapel}
              className="min-h-9 inline-flex items-center justify-center gap-1 rounded-lg border border-[#DDE3EA] text-xs font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
            >
              <IconUpload size={14} />
              Cargar Planilla
            </button>
          )}
          <a
            href={impresion.href}
            {...(impresion.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`min-h-9 inline-flex items-center justify-center gap-1 rounded-lg border border-[#DDE3EA] text-xs font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
              puedeCargar ? "" : "col-span-2"
            }`}
          >
            <IconPrinter size={14} />
            Imprimir
          </a>
        </div>
      </div>
    </article>
  );
}

function ResumenMes({
  mes,
}: {
  mes: {
    pendientes: number;
    observaciones: number;
    documentos: Array<{ id: string; nombre: string; vencimiento: string | null }>;
    noConformidades: Array<{ id: string; descripcion: string; severidad: string; fechaLimite: string | null }>;
  };
}) {
  if (mes.documentos.length === 0 && mes.noConformidades.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#DDE3EA] bg-[#F8FAFC] p-4 space-y-2">
      <p className="text-sm font-semibold text-[#0B1B33]">Fuera del turno, antes de cerrar el mes</p>
      <ul className="space-y-2 text-sm text-[#334155]">
        {mes.documentos.map((documento) => (
          <li key={documento.id}>
            <Link href="/documentos" className="underline">
              {documento.nombre}
            </Link>
            {documento.vencimiento ? ` vence el ${formatDate(documento.vencimiento)}` : ""}.
          </li>
        ))}
        {mes.noConformidades.map((item) => (
          <li key={item.id}>
            <Link href="/visitas" className="underline">
              {item.descripcion}
            </Link>
            {item.fechaLimite ? ` · límite ${formatDate(item.fechaLimite)}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
