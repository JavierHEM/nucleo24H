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
        "bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#5B6980] leading-tight">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-[#E5F1E3] flex items-center justify-center">
          <Icon size={16} className="text-[#2F6B2A]" />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#0B1B33]">{value}</div>
      {description && (
        <p
          className={cn("text-xs mt-1", {
            "text-[#2F6B2A]": trend === "up",
            "text-[#B42318]": trend === "down",
            "text-[#5B6980]": !trend || trend === "neutral",
          })}
        >
          {description}
        </p>
      )}
    </div>
  );
}
