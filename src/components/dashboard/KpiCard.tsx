import { cn } from "@/lib/utils";
import type { Icon as TablerIcon } from "@tabler/icons-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: TablerIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#64748B] leading-tight">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-[#EBF5E6] flex items-center justify-center">
          <Icon size={16} className="text-[#4B8B2E]" />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#0B2545]">{value}</div>
      {description && (
        <p
          className={cn("text-xs mt-1", {
            "text-[#16A34A]": trend === "up",
            "text-[#DC2626]": trend === "down",
            "text-[#64748B]": !trend || trend === "neutral",
          })}
        >
          {description}
        </p>
      )}
    </div>
  );
}
