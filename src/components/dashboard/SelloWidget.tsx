import { cn, formatPeriodo } from "@/lib/utils";
import { SELLO_CONFIG, type NivelSello } from "@/components/sellos/SelloBadge";

interface Dimension {
  nombre: string;
  valor: number;
}

interface SelloWidgetProps {
  nivel: NivelSello;
  score: number;
  periodo: string;
  planMejoras?: string[];
  descargosHabilitados?: boolean;
  dimensiones?: Dimension[];
}

const NEXT_LEVEL: Record<NivelSello, { label: string; umbral: number } | null> = {
  inicial: { label: "Intermedio", umbral: 60 },
  intermedio: { label: "Avanzado", umbral: 75 },
  avanzado: { label: "Premium", umbral: 90 },
  premium: null,
};

const ANILLO: Record<NivelSello, string> = {
  inicial: "#B42318",
  intermedio: "#E8B100",
  avanzado: "#2F6B2A",
  premium: "#0B1B33",
};

function colorBarra(valor: number) {
  if (valor >= 75) return "#2F6B2A";
  if (valor >= 60) return "#8A5A00";
  return "#B42318";
}

export function SelloWidget({
  nivel,
  score,
  periodo,
  planMejoras = [],
  descargosHabilitados = false,
  dimensiones = [],
}: SelloWidgetProps) {
  const config = SELLO_CONFIG[nivel];
  const siguiente = NEXT_LEVEL[nivel];
  const puntos = Math.max(0, Math.ceil((siguiente?.umbral ?? score) - score));
  const color = ANILLO[nivel];

  return (
    <section className="bg-white border border-[#DDE3EA] rounded-[14px] p-6 flex flex-wrap gap-8 items-center" aria-label="Avance del sello">
      <div className="flex items-center gap-6 flex-1 min-w-[280px]">
        <div
          className="w-[148px] h-[148px] rounded-full flex items-center justify-center shrink-0"
          style={{ background: `conic-gradient(${color} ${Math.max(0, Math.min(score, 100))}%, #E5F1E3 0)` }}
        >
          <div className="w-[116px] h-[116px] rounded-full bg-white flex flex-col items-center justify-center">
            <p className="font-mono text-4xl font-semibold leading-none text-[#0B1B33]">{Math.round(score)}</p>
            <p className="text-xs font-semibold text-[#5B6980]">de 100</p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className={cn("inline-flex self-start items-center h-7 px-3 rounded-full text-[13px] font-bold", config.bg)}>
            {config.label} · {formatPeriodo(periodo)}
          </span>
          <p className="text-2xl font-extrabold leading-tight text-[#0B1B33]">
            {siguiente && puntos > 0
              ? `Te faltan ${puntos} puntos para ${siguiente.label}`
              : nivel === "premium"
                ? "Nivel Premium de este período"
                : `Nivel ${config.label} alcanzado`}
          </p>
          {descargosHabilitados && (
            <p className="text-[15px] font-medium leading-relaxed text-[#41506A]">Los descargos de este período están habilitados.</p>
          )}
          {planMejoras.length > 0 && (
            <ul className="space-y-1">
              {planMejoras.slice(0, 3).map((mejora) => (
                <li key={mejora} className="text-sm font-semibold text-[#41506A]">{mejora}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {dimensiones.length > 0 && (
        <div className="flex-1 min-w-[260px] flex flex-col gap-3.5">
          {dimensiones.map((dimension) => (
            <div key={dimension.nombre} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm font-bold text-[#0B1B33]">
                <span>{dimension.nombre}</span>
                <span className="font-mono">{Math.round(dimension.valor)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#E8ECF1] overflow-hidden">
                <div className="h-full" style={{ width: `${Math.max(0, Math.min(dimension.valor, 100))}%`, background: colorBarra(dimension.valor) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
