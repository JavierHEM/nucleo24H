"use client";

import { IconMedal, IconSparkles, IconListCheck } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { SelloWidget } from "@/components/dashboard/SelloWidget";
import { SELLO_CONFIG, type NivelSello } from "@/components/sellos/SelloBadge";
import { SolicitarRevisionButton } from "./SolicitarRevisionButton";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { getCurrentPeriodo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  userRole?: string | null;
}

export function SelloActual({ userRole }: Props) {
  const periodo = getCurrentPeriodo();
  const { data: sello, isLoading } = trpc.sellos.getActual.useQuery({ periodo });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-56 rounded-xl bg-[#DDE3EA] animate-pulse" />
        <div className="h-32 rounded-xl bg-[#DDE3EA] animate-pulse" />
      </div>
    );
  }

  if (!sello) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#DDE3EA] bg-white p-10 text-center flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#E5F1E3] flex items-center justify-center">
          <IconMedal size={24} className="text-[#2F6B2A]" />
        </div>
        <div>
          <p className="font-semibold text-[#0B1B33]">Sin sello para {periodo}</p>
          <p className="text-sm text-[#5B6980] mt-1">
            Tu asesor emitirá el sello al cierre del mes.
          </p>
        </div>
      </div>
    );
  }

  const nivel = sello.nivel as NivelSello;
  const config = SELLO_CONFIG[nivel];
  const planMejoras = (sello.plan_mejoras ?? []) as string[];
  const descargos = sello.descargos_habilitados ?? false;

  return (
    <div className="space-y-4">
      <ScoreCards
        items={[
          { label: "Nivel", value: config.label, hint: periodo, tone: nivel === "avanzado" || nivel === "premium" ? "ok" : "alerta" },
          { label: "Puntaje", value: Math.round(sello.score_general), hint: "De 100", tone: sello.score_general >= 75 ? "ok" : "alerta" },
          { label: "Mejoras", value: planMejoras.length, hint: "En el plan", tone: planMejoras.length > 0 ? "alerta" : "ok" },
          { label: "Descargos", value: descargos ? "Sí" : "No", hint: "Habilitados", tone: descargos ? "ok" : "neutral" },
        ]}
      />
      <SelloWidget
        nivel={nivel}
        score={sello.score_general}
        periodo={sello.periodo}
        planMejoras={planMejoras}
        descargosHabilitados={descargos}
      />

      {/* admin_local puede solicitar revisión si considera que el resultado no es correcto */}
      {(userRole === "admin_local" || userRole === "jefe_local") && (
        <div className="flex justify-end">
          <SolicitarRevisionButton selloId={sello.id} />
        </div>
      )}

      {/* Desglose por categoría */}
      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#0B1B33] mb-4">Desglose por categoría</p>
        <div className="space-y-3">
          {[
            { label: "Documentación y registros", score: sello.score_documentacion, peso: "30%" },
            { label: "Condiciones del local", score: sello.score_condiciones, peso: "25%" },
            { label: "Capacitaciones", score: sello.score_capacitaciones, peso: "25%" },
            { label: "Tareas completadas", score: sello.score_tareas, peso: "20%" },
          ].map((cat) => (
            <div key={cat.label}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#0B1B33]">{cat.label}</span>
                  <span className="text-xs text-[#5B6980]">({cat.peso})</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    cat.score >= 80
                      ? "text-[#2F6B2A]"
                      : cat.score >= 60
                      ? "text-[#D97706]"
                      : "text-[#B42318]"
                  )}
                >
                  {cat.score.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#DDE3EA] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    config.progressBar
                  )}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan de mejoras */}
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

      {/* Banner descargos */}
      {descargos && (
        <div className="bg-[#1C1917] text-white rounded-xl p-4 flex items-start gap-3">
          <IconSparkles size={20} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Descargos administrativos habilitados</p>
            <p className="text-xs text-white/70 mt-1">
              Como local Premium, tienes derecho a descargos gratuitos ante la autoridad sanitaria por materias del servicio contratado. Contacta a tu asesor para utilizarlos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
