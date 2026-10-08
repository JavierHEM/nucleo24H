"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import { PlanillaSheet } from "@/components/registros/PlanillaSheet";
import { AjustarProgramaSheet } from "@/components/guia/AjustarProgramaSheet";
import type { ItemAgenda, Momento } from "@/lib/bpm/programa";

const MOMENTO_LABEL: Record<Momento, string> = {
  inicio: "Al inicio",
  durante: "Durante el turno",
  cierre: "Al cierre",
};

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  hecho: "Hecho",
  observacion: "Con observación",
} as const;

const ESTADO_CLASS = {
  pendiente: "bg-amber-50 text-amber-800",
  hecho: "bg-[#EBF5E6] text-[#3A6E24]",
  observacion: "bg-orange-50 text-orange-800",
} as const;

export function GuiaDelDia({ puedeAjustar }: { puedeAjustar: boolean }) {
  const utils = trpc.useUtils();
  const agenda = trpc.programa.agenda.useQuery();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState(false);

  const hoy = agenda.data?.hoy ?? [];
  const eventos = agenda.data?.eventos ?? [];
  const mes = agenda.data?.mes;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0B2545]">Hoy en el local</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Lo que corresponde en este turno.</p>
        </div>
        {puedeAjustar && (
          <button
            type="button"
            onClick={() => setAjustando(true)}
            className="text-sm font-medium text-[#143556] shrink-0"
          >
            Ajustar programa
          </button>
        )}
      </div>

      {agenda.isLoading && <p className="text-sm text-[#64748B]">Cargando la guía…</p>}
      {agenda.error && (
        <p className="text-sm text-[#DC2626] bg-red-50 rounded-xl px-3 py-2">{agenda.error.message}</p>
      )}

      {mes && <ResumenMes mes={mes} />}

      {(["inicio", "durante", "cierre"] as const).map((momento) => {
        const items = hoy.filter((item) => item.momento === momento);
        if (items.length === 0) return null;
        return (
          <div key={momento} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{MOMENTO_LABEL[momento]}</p>
            {items.map((item) => (
              <Fila key={item.codigo} item={item} onRegistrar={() => setCodigo(item.codigo)} />
            ))}
          </div>
        );
      })}

      {!agenda.isLoading && hoy.length === 0 && (
        <p className="text-sm text-[#64748B] bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
          No hay controles para hoy.
        </p>
      )}

      {eventos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Si pasa esto</p>
          {eventos.map((item) => (
            <Fila key={item.codigo} item={item} onRegistrar={() => setCodigo(item.codigo)} evento />
          ))}
        </div>
      )}

      <PlanillaSheet
        abierto={Boolean(codigo)}
        codigo={codigo}
        onCerrar={() => setCodigo(null)}
        onSuccess={() => utils.programa.agenda.invalidate()}
      />
      <AjustarProgramaSheet abierto={ajustando} onCerrar={() => setAjustando(false)} />
    </section>
  );
}

function Fila({ item, onRegistrar, evento = false }: { item: ItemAgenda; onRegistrar: () => void; evento?: boolean }) {
  return (
    <article className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm text-[#0B2545]">{item.nombre}</p>
          <p className="text-xs text-[#64748B] mt-1">{item.cuando}</p>
        </div>
        {!evento && (
          <span className={`shrink-0 text-xs font-medium rounded-full px-2.5 py-1 ${ESTADO_CLASS[item.estado]}`}>
            {ESTADO_LABEL[item.estado]}
          </span>
        )}
      </div>
      <p className="text-sm text-[#334155] mt-2">{item.porque}</p>
      {item.detalle && <p className="text-xs text-[#B45309] mt-1">{item.detalle}</p>}
      <button type="button" onClick={onRegistrar} className="mt-3 text-sm font-medium text-[#4B8B2E]">
        Registrar
      </button>
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
  const hayAlgo = mes.pendientes > 0 || mes.observaciones > 0 || mes.documentos.length > 0 || mes.noConformidades.length > 0;
  if (!hayAlgo) return null;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
      <p className="text-sm font-semibold text-[#0B2545]">Para cerrar el mes</p>
      <ul className="space-y-2 text-sm text-[#334155]">
        {mes.pendientes > 0 && <li>{mes.pendientes} control{mes.pendientes === 1 ? "" : "es"} de hoy sin registrar.</li>}
        {mes.observaciones > 0 && (
          <li>
            {mes.observaciones} control{mes.observaciones === 1 ? "" : "es"} de hoy con observación.
          </li>
        )}
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
