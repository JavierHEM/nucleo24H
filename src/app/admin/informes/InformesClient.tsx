"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  IconChartBar,
  IconBuilding,
  IconAlertTriangle,
  IconClipboardList,
  IconChevronRight,
  IconCalendar,
} from "@tabler/icons-react";

const NIVEL_COLORS: Record<string, string> = {
  inicial: "bg-red-100 text-red-700",
  intermedio: "bg-yellow-100 text-yellow-700",
  avanzado: "bg-blue-100 text-blue-700",
  premium: "bg-[#2F6B2A]/10 text-[#2F6B2A]",
};

const NIVEL_LABEL: Record<string, string> = {
  inicial: "Inicial",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  premium: "Premium",
};

function getPeriodosPrevios(n: number): string[] {
  const periodos = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periodos.push(d.toISOString().slice(0, 7));
  }
  return periodos;
}

function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split("-");
  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

type LocalRow = {
  tenant: { id: string; nombre: string; ciudad: string; plan: string; estado: string };
  sello: {
    nivel: string;
    score_general: number;
    score_documentacion: number;
    score_condiciones: number;
    score_capacitaciones: number;
    score_tareas: number;
    emitido_at: string | Date | null;
  } | null;
  registros_mes: number;
  ncs_abiertas: number;
};

export function InformesClient() {
  const periodos = getPeriodosPrevios(6);
  const [periodo, setPeriodo] = useState(periodos[0]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const { data: locales, isLoading } = trpc.informes.resumenLocales.useQuery({ periodo });
  const { data: detalle } = trpc.informes.detalleLocal.useQuery(
    { tenant_id: selectedTenant! },
    { enabled: !!selectedTenant }
  );

  const totalLocales = locales?.length ?? 0;
  const conSello = locales?.filter((l) => l.sello).length ?? 0;
  const totalNCs = locales?.reduce((s, l) => s + l.ncs_abiertas, 0) ?? 0;
  const avgScore =
    locales && locales.length > 0
      ? Math.round(
          locales
            .filter((l) => l.sello)
            .reduce((s, l) => s + (l.sello?.score_general ?? 0), 0) /
            Math.max(conSello, 1)
        )
      : null;

  if (selectedTenant && detalle) {
    const local = locales?.find((l) => l.tenant.id === selectedTenant);
    return (
      <div>
        <button
          onClick={() => setSelectedTenant(null)}
          className="flex items-center gap-1.5 text-sm text-[#5B6980] hover:text-[#0B1B33] mb-6 transition-colors"
        >
          ← Volver al resumen
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0B1B33]">
              {detalle.tenant?.nombre}
            </h2>
            <p className="text-sm text-[#5B6980]">
              {detalle.tenant?.ciudad} · Plan {detalle.tenant?.plan}
            </p>
          </div>
          {local?.sello && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${NIVEL_COLORS[local.sello.nivel] ?? ""}`}>
              {NIVEL_LABEL[local.sello.nivel] ?? local.sello.nivel}
            </span>
          )}
        </div>

        {/* Historial de sellos */}
        <div className="bg-white rounded-2xl border border-[#DDE3EA] p-5 mb-4">
          <h3 className="font-semibold text-[#0B1B33] mb-4 flex items-center gap-2">
            <IconChartBar size={18} className="text-[#2F6B2A]" />
            Historial de Sellos
          </h3>
          {detalle.sellosHistorial.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">Sin sellos emitidos aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#94A3B8] border-b border-[#F1F5F9]">
                    <th className="pb-2 font-medium">Período</th>
                    <th className="pb-2 font-medium">Nivel</th>
                    <th className="pb-2 font-medium text-right">Score</th>
                    <th className="pb-2 font-medium text-right">Doc.</th>
                    <th className="pb-2 font-medium text-right">Cond.</th>
                    <th className="pb-2 font-medium text-right">Cap.</th>
                    <th className="pb-2 font-medium text-right">Tar.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {detalle.sellosHistorial.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 text-[#334155]">{formatPeriodo(s.periodo)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${NIVEL_COLORS[s.nivel] ?? ""}`}>
                          {NIVEL_LABEL[s.nivel] ?? s.nivel}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-[#0B1B33]">
                        {Math.round(s.score_general)}%
                      </td>
                      <td className="py-2.5 text-right text-[#5B6980]">{Math.round(s.score_documentacion)}%</td>
                      <td className="py-2.5 text-right text-[#5B6980]">{Math.round(s.score_condiciones)}%</td>
                      <td className="py-2.5 text-right text-[#5B6980]">{Math.round(s.score_capacitaciones)}%</td>
                      <td className="py-2.5 text-right text-[#5B6980]">{Math.round(s.score_tareas)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visitas y NCs */}
        <div className="bg-white rounded-2xl border border-[#DDE3EA] p-5">
          <h3 className="font-semibold text-[#0B1B33] mb-4 flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-amber-500" />
            Visitas recientes y No Conformidades
          </h3>
          {detalle.visitas.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">Sin visitas registradas.</p>
          ) : (
            <div className="space-y-3">
              {detalle.visitas.map((v) => {
                const ncsAbiertas = v.no_conformidades.filter((nc) => !nc.cerrada_at).length;
                const ncsCerradas = v.no_conformidades.filter((nc) => nc.cerrada_at).length;
                return (
                  <div key={v.id} className="border border-[#F1F5F9] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#334155]">
                        {new Date(v.fecha).toLocaleDateString("es-CL", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                      <div className="flex gap-2 text-xs">
                        {ncsAbiertas > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                            {ncsAbiertas} NC abiertas
                          </span>
                        )}
                        {ncsCerradas > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            {ncsCerradas} resueltas
                          </span>
                        )}
                        {v.no_conformidades.length === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#5B6980]">
                            Sin NC
                          </span>
                        )}
                      </div>
                    </div>
                    {v.hallazgos && (
                      <p className="text-xs text-[#5B6980]">{v.hallazgos}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con selector de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Informes mensuales</h1>
          <p className="text-sm text-[#5B6980] mt-0.5">Resumen de tus locales asignados</p>
        </div>
        <div className="flex items-center gap-2">
          <IconCalendar size={16} className="text-[#5B6980]" />
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#DDE3EA] text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]/30"
          >
            {periodos.map((p) => (
              <option key={p} value={p}>
                {formatPeriodo(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#DDE3EA] p-4">
          <p className="text-xs text-[#94A3B8] mb-1">Locales activos</p>
          <p className="text-2xl font-bold text-[#0B1B33]">{totalLocales}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#DDE3EA] p-4">
          <p className="text-xs text-[#94A3B8] mb-1">Con sello emitido</p>
          <p className="text-2xl font-bold text-[#2F6B2A]">{conSello}</p>
          <p className="text-xs text-[#94A3B8]">de {totalLocales}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#DDE3EA] p-4">
          <p className="text-xs text-[#94A3B8] mb-1">Score promedio</p>
          <p className="text-2xl font-bold text-[#0B1B33]">
            {avgScore !== null ? `${avgScore}%` : "—"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#DDE3EA] p-4">
          <p className="text-xs text-[#94A3B8] mb-1">NCs abiertas</p>
          <p className={`text-2xl font-bold ${totalNCs > 0 ? "text-red-600" : "text-[#0B1B33]"}`}>
            {totalNCs}
          </p>
        </div>
      </div>

      {/* Tabla de locales */}
      <div className="bg-white rounded-2xl border border-[#DDE3EA] overflow-hidden">
        <div className="p-5 border-b border-[#F1F5F9]">
          <h2 className="font-semibold text-[#0B1B33] flex items-center gap-2">
            <IconBuilding size={18} className="text-[#2F6B2A]" />
            Detalle por local
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2F6B2A] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !locales || locales.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            <IconBuilding size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No tienes locales asignados aún.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8FAFC]">
            {locales.map((row: LocalRow) => (
              <button
                key={row.tenant.id}
                onClick={() => setSelectedTenant(row.tenant.id)}
                className="w-full text-left px-5 py-4 hover:bg-[#F8FAFC] transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-[#0B1B33] truncate">
                        {row.tenant.nombre}
                      </span>
                      {row.sello ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${NIVEL_COLORS[row.sello.nivel] ?? ""}`}>
                          {NIVEL_LABEL[row.sello.nivel] ?? row.sello.nivel}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#94A3B8]">
                          Sin sello
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <IconClipboardList size={12} />
                        {row.registros_mes} registros
                      </span>
                      {row.ncs_abiertas > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <IconAlertTriangle size={12} />
                          {row.ncs_abiertas} NC abiertas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {row.sello && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-[#94A3B8]">Score general</p>
                        <p className="text-lg font-bold text-[#0B1B33]">
                          {Math.round(row.sello.score_general)}%
                        </p>
                      </div>
                    )}
                    <IconChevronRight
                      size={16}
                      className="text-[#CBD5E1] group-hover:text-[#5B6980] transition-colors"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
