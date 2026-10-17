export type ScoreItem = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ok" | "alerta" | "neutral";
};

const TONO = {
  ok: "text-[#255620]",
  alerta: "text-[#8A5A00]",
  neutral: "text-[#0B1B33]",
} as const;

export function ScoreCards({ items }: { items: ScoreItem[] }) {
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <li key={item.label} className="rounded-[14px] border border-[#DDE3EA] bg-white px-5 py-4">
          <p className="text-[13px] font-semibold text-[#5B6980]">{item.label}</p>
          <p className={`mt-1.5 font-mono text-4xl font-semibold leading-none tabular-nums ${TONO[item.tone ?? "neutral"]}`}>{item.value}</p>
          {item.hint && <p className="text-[13px] font-semibold text-[#5B6980] mt-1.5">{item.hint}</p>}
        </li>
      ))}
    </ul>
  );
}
