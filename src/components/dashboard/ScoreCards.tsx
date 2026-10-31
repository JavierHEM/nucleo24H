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
    <div className="@container">
      <ul className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.label} className="min-w-0 rounded-[14px] border border-[#DDE3EA] bg-white px-4 py-4">
            <p className="text-[13px] font-semibold text-[#5B6980]">{item.label}</p>
            <p
              className={`mt-1.5 font-semibold break-words ${TONO[item.tone ?? "neutral"]} ${
                typeof item.value === "number"
                  ? "font-mono text-4xl leading-none tabular-nums"
                  : "text-xl leading-snug tracking-tight"
              }`}
            >
              {item.value}
            </p>
            {item.hint && <p className="text-[13px] font-semibold text-[#5B6980] mt-1.5">{item.hint}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
