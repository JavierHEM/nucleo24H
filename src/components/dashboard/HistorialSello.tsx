import Link from "next/link";
import { formatPeriodo } from "@/lib/utils";

const COLOR_NIVEL: Record<string, string> = {
  inicial: "bg-[#FCE4E1] text-[#9A1C12]",
  intermedio: "bg-[#FCF0D0] text-[#7A5000]",
  avanzado: "bg-[#E5F1E3] text-[#255620]",
  premium: "bg-[#0B1B33] text-[#E3B341]",
};

export function HistorialSello({ sellos }: { sellos: { periodo: string; nivel: string; score: number }[] }) {
  if (sellos.length === 0) return null;
  return (
    <section aria-label="Historial del sello" className="rounded-[14px] border border-[#DDE3EA] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#5B6980]">Historial del sello</p>
        <Link href="/sellos" className="text-xs font-medium text-[#255620] hover:underline">
          Ver todos
        </Link>
      </div>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {sellos.map((sello) => (
          <li key={sello.periodo} className="min-w-[116px] rounded-xl border border-[#DDE3EA] px-3 py-2.5">
            <p className="text-xs font-semibold text-[#5B6980] capitalize">{formatPeriodo(sello.periodo)}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-[#0B1B33]">{Math.round(sello.score)}%</p>
            <span className={`mt-1 inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold capitalize ${COLOR_NIVEL[sello.nivel] ?? COLOR_NIVEL.inicial}`}>
              {sello.nivel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
