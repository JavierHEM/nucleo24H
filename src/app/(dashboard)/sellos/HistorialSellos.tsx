"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { EvolucionChart } from "@/components/dashboard/EvolucionChart";
import { formatPeriodo } from "@/lib/utils";
import { SelloBadge, type NivelSello } from "@/components/sellos/SelloBadge";
import { IconMedal, IconExternalLink } from "@tabler/icons-react";
import { getAppUrl } from "@/lib/branding";

const APP_URL = getAppUrl();

export function HistorialSellos() {
  const { data: historial, isLoading } = trpc.sellos.getHistorial.useQuery({ limit: 12 });

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-[#DDE3EA] animate-pulse" />;
  }

  if (!historial || historial.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
        <IconMedal size={32} className="mx-auto text-[#DDE3EA] mb-3" />
        <p className="text-sm text-[#5B6980]">Aún no hay historial de sellos.</p>
        <p className="text-xs text-[#5B6980] mt-1">
          Los sellos mensuales aparecerán aquí a medida que el asesor los emita.
        </p>
      </div>
    );
  }

  const chartData = [...historial]
    .reverse()
    .map((s) => ({ periodo: s.periodo, score: s.score_general, nivel: s.nivel }));

  return (
    <div className="space-y-5">
      {historial.length >= 2 && <EvolucionChart data={chartData} />}

      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[#DDE3EA] bg-[#F4F6F3]">
          <p className="text-xs font-semibold text-[#5B6980] uppercase tracking-wide">
            Historial completo
          </p>
        </div>
        <div className="divide-y divide-[#DDE3EA]">
          {historial.map((sello) => (
            <div
              key={sello.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-[#F4F6F3] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E5F1E3] flex items-center justify-center shrink-0">
                <IconMedal size={16} className="text-[#2F6B2A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0B1B33]">
                  {formatPeriodo(sello.periodo)}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-[#5B6980]">
                  <span>Doc: {sello.score_documentacion.toFixed(0)}%</span>
                  <span>Cond: {sello.score_condiciones.toFixed(0)}%</span>
                  <span className="hidden sm:inline">Cap: {sello.score_capacitaciones.toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-[#0B1B33] leading-none">
                    {sello.score_general.toFixed(0)}%
                  </p>
                  <div className="mt-1">
                    <SelloBadge nivel={sello.nivel as NivelSello} size="sm" />
                  </div>
                </div>
                <Link
                  href={`${APP_URL}/sello/${sello.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver certificado público"
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2F6B2A] hover:bg-[#E5F1E3] transition-colors"
                >
                  <IconExternalLink size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
