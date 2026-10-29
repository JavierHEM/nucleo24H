import { PLANES, normalizarPlan } from "@/lib/planes";

export function PlanBadge({ plan, tone = "light" }: { plan: unknown; tone?: "light" | "dark" }) {
  const id = normalizarPlan(plan);
  const integral = id === "integral";
  const clases = integral
    ? tone === "dark"
      ? "bg-[#E3B341] text-[#0B1B33]"
      : "bg-[#16294A] text-white"
    : tone === "dark"
      ? "bg-[#2A4068] text-white"
      : "bg-[#E5F1E3] text-[#255620]";
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold ${clases}`}>
      {PLANES[id].nombre}
    </span>
  );
}
