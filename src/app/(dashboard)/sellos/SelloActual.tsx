"use client";

import { IconMedal, IconListCheck } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { SelloWidget } from "@/components/dashboard/SelloWidget";
import { SELLO_CONFIG, type NivelSello } from "@/components/sellos/SelloBadge";
import { SolicitarRevisionButton } from "./SolicitarRevisionButton";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { formatPeriodo, getCurrentPeriodo } from "@/lib/utils";
import { selloEsDelPeriodoEnCurso } from "@/lib/sellos/vigente";
import { cn } from "@/lib/utils";
import { COMPONENTES_SEGUIMIENTO, COMPONENTES_VISITA } from "@/lib/sellos/v2";
import { LEYENDA_ALCANCE_SELLO } from "@/lib/declaraciones/textos";

interface Props {
  userRole?: string | null;
}

export function SelloActual({ userRole }: Props) {
  const periodo = getCurrentPeriodo();
  const { data: vigente, isLoading } = trpc.sellos.getVigente.useQuery();
  const { data: delMes } = trpc.sellos.getActual.useQuery({ periodo });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-56 rounded-xl bg-[#DDE3EA] animate-pulse" />
        <div className="h-32 rounded-xl bg-[#DDE3EA] animate-pulse" />
      </div>
    );
  }

  const propuestaPendiente = delMes?.estado === "propuesto";
  const sello = vigente;

  if (!sello) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#DDE3EA] bg-white p-10 text-center flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#E5F1E3] flex items-center justify-center">
          <IconMedal size={24} className="text-[#2F6B2A]" />
        </div>
        <div>
          <p className="font-semibold text-[#0B1B33]">
            {propuestaPendiente ? "Propuesta en revisión" : "Aún no hay un sello emitido"}
          </p>
          <p className="text-sm text-[#5B6980] mt-1">
            {propuestaPendiente
              ? "El asesor ya propuso el sello. Falta la aprobación de la socia."
              : "Se calcula y entrega al cierre de cada mes."}
          </p>
        </div>
      </div>
    );
  }

  const nivel = sello.nivel as NivelSello;
  const config = SELLO_CONFIG[nivel] ?? SELLO_CONFIG.sin_sello;
  const planMejoras = (sello.plan_mejoras ?? []) as string[];
  const esV2 = sello.esquema === "v2";
  const componentes = (sello.scores_componentes ?? {}) as Record<string, number>;

  const desglose = esV2
    ? [
        ...COMPONENTES_SEGUIMIENTO.map((c) => ({
          label: c.etiqueta,
          score: ((componentes[c.id] ?? 0) / c.puntos) * 100,
          peso: `${c.puntos} pts`,
        })),
        ...COMPONENTES_VISITA.map((c) => ({
          label: c.etiqueta,
          score: ((componentes[c.id] ?? 0) / c.puntos) * 100,
          peso: `${c.puntos} pts`,
        })),
      ]
    : [
        { label: "Documentación y registros", score: sello.score_documentacion, peso: "30%" },
        { label: "Condiciones del local", score: sello.score_condiciones, peso: "25%" },
        { label: "Capacitaciones", score: sello.score_capacitaciones, peso: "25%" },
        { label: "Tareas completadas", score: sello.score_tareas, peso: "20%" },
      ];

  return (
    <div className="space-y-4">
      {propuestaPendiente && (
        <p className="rounded-xl border border-[#F8E8C4] bg-[#FCF0D0] px-4 py-3 text-sm text-[#7A5000]">
          Hay una propuesta de {formatPeriodo(periodo)} en revisión. Mientras tanto se muestra el último sello emitido.
        </p>
      )}
      <ScoreCards
        items={[
          { label: "Nivel", value: config.label, hint: formatPeriodo(sello.periodo), tone: nivel === "oro" || nivel === "plata" || nivel === "avanzado" || nivel === "premium" ? "ok" : "alerta" },
          { label: "Puntaje", value: Math.round(sello.score_general), hint: "De 100", tone: sello.score_general >= 70 ? "ok" : "alerta" },
          { label: "Seguimiento", value: esV2 ? Math.round(sello.score_seguimiento) : "—", hint: "60 pts", tone: "neutral" },
          { label: "Visita", value: esV2 ? Math.round(sello.score_visita) : "—", hint: "40 pts", tone: "neutral" },
        ]}
      />
      <SelloWidget
        nivel={nivel}
        score={sello.score_general}
        periodo={sello.periodo}
        planMejoras={planMejoras}
        nota={
          selloEsDelPeriodoEnCurso(sello.periodo, periodo)
            ? undefined
            : `Último sello emitido. El de ${formatPeriodo(periodo)} se calcula al cierre del mes.`
        }
      />
      <p className="text-xs text-[#5B6980]">{LEYENDA_ALCANCE_SELLO}</p>

      {(userRole === "admin_local" || userRole === "jefe_local") && (
        <div className="flex justify-end">
          <SolicitarRevisionButton selloId={sello.id} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#0B1B33] mb-4">Desglose</p>
        <div className="space-y-3">
          {desglose.map((cat) => (
            <div key={cat.label}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#0B1B33]">{cat.label}</span>
                  <span className="text-xs text-[#5B6980]">({cat.peso})</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    cat.score >= 80 ? "text-[#2F6B2A]" : cat.score >= 60 ? "text-[#D97706]" : "text-[#B42318]"
                  )}
                >
                  {cat.score.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#DDE3EA] overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", config.progressBar)}
                  style={{ width: `${Math.max(0, Math.min(100, cat.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {planMejoras.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <IconListCheck size={18} className="text-[#2F6B2A]" />
            <p className="text-sm font-semibold text-[#0B1B33]">Plan de mejoras</p>
          </div>
          <div className="space-y-2">
            {planMejoras.map((mejora, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#E5F1E3] text-[#255620] text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-[#334155] leading-snug">{mejora}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
