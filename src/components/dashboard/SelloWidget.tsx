import { IconMedal, IconSparkles } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatPeriodo } from "@/lib/utils";
import { SelloBadge, SELLO_CONFIG, type NivelSello } from "@/components/sellos/SelloBadge";

interface SelloWidgetProps {
  nivel: NivelSello;
  score: number;
  periodo: string;
  planMejoras?: string[];
  descargosHabilitados?: boolean;
}

const NEXT_LEVEL: Record<NivelSello, { label: string; umbral: number } | null> = {
  inicial:    { label: "Intermedio", umbral: 60 },
  intermedio: { label: "Avanzado", umbral: 75 },
  avanzado:   { label: "Premium", umbral: 90 },
  premium:    null,
};

export function SelloWidget({
  nivel,
  score,
  periodo,
  planMejoras = [],
  descargosHabilitados = false,
}: SelloWidgetProps) {
  const config = SELLO_CONFIG[nivel];
  const nextLevel = NEXT_LEVEL[nivel];
  const isPremium = nivel === "premium";

  return (
    <div
      className={cn(
        "rounded-xl border-l-4 bg-white shadow-sm p-5 h-full",
        config.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#64748B]">Sello de Cumplimiento</p>
        <SelloBadge nivel={nivel} size="sm" />
      </div>

      {/* Score principal */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
            isPremium ? "bg-[#1C1917]" : config.bgCard
          )}
        >
          <IconMedal
            size={28}
            className={cn(isPremium ? "text-yellow-400" : config.color)}
          />
        </div>
        <div>
          <p className={cn("text-5xl font-bold leading-none", isPremium ? "text-[#1C1917]" : config.color)}>
            {score.toFixed(0)}
            <span className="text-2xl">%</span>
          </p>
          <p className="text-xs text-[#64748B] mt-1">{formatPeriodo(periodo)}</p>
        </div>
      </div>

      {/* Barra de progreso hacia siguiente nivel */}
      {nextLevel && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#64748B] mb-1">
            <span>Hacia {nextLevel.label}</span>
            <span>{nextLevel.umbral - score > 0 ? `falta ${(nextLevel.umbral - score).toFixed(0)}%` : "¡Nivel alcanzado!"}</span>
          </div>
          <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", config.progressBar)}
              style={{ width: `${Math.min(100, (score / nextLevel.umbral) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Descargos habilitados */}
      {descargosHabilitados && (
        <div className="flex items-center gap-2 text-xs text-[#2D5A27] bg-[#EAF3E0] rounded-lg px-3 py-2 mb-3">
          <IconSparkles size={14} className="shrink-0" />
          <span className="font-medium">Descargos administrativos gratuitos habilitados</span>
        </div>
      )}

      {/* Plan de mejoras (primero 2) */}
      {planMejoras.length > 0 && !isPremium && (
        <div className="space-y-1">
          {planMejoras.slice(0, 2).map((mejora, i) => (
            <p key={i} className="text-xs text-[#64748B] leading-snug">
              • {mejora}
            </p>
          ))}
        </div>
      )}

      {isPremium && (
        <p className="text-xs text-[#64748B]">
          ¡Cumplimiento sobresaliente! Mantén el nivel este mes. 🏆
        </p>
      )}
    </div>
  );
}
