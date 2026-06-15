import { IconMedal } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type NivelSello = "inicial" | "intermedio" | "avanzado" | "premium";

interface SelloConfig {
  label: string;
  color: string;       // texto
  bg: string;          // fondo badge
  bgCard: string;      // fondo widget/card
  border: string;      // borde
  progressBar: string; // barra de progreso
}

export const SELLO_CONFIG: Record<NivelSello, SelloConfig> = {
  inicial: {
    label: "Inicial",
    color: "text-red-700",
    bg: "bg-red-100 text-red-800",
    bgCard: "bg-red-50",
    border: "border-l-[#DC2626]",
    progressBar: "bg-[#DC2626]",
  },
  intermedio: {
    label: "Intermedio",
    color: "text-amber-700",
    bg: "bg-yellow-100 text-yellow-800",
    bgCard: "bg-yellow-50",
    border: "border-l-[#D97706]",
    progressBar: "bg-[#D97706]",
  },
  avanzado: {
    label: "Avanzado",
    color: "text-[#16A34A]",
    bg: "bg-green-100 text-green-800",
    bgCard: "bg-[#EAF3E0]",
    border: "border-l-[#16A34A]",
    progressBar: "bg-[#16A34A]",
  },
  premium: {
    label: "Premium",
    color: "text-white",
    bg: "bg-[#1C1917] text-white",
    bgCard: "bg-[#1C1917]",
    border: "border-l-[#1C1917]",
    progressBar: "bg-[#1C1917]",
  },
};

interface SelloBadgeProps {
  nivel: NivelSello;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function SelloBadge({
  nivel,
  size = "md",
  showIcon = false,
  className,
}: SelloBadgeProps) {
  const config = SELLO_CONFIG[nivel];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        config.bg,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm px-2.5 py-1",
        size === "lg" && "text-base px-3 py-1.5",
        className
      )}
    >
      {showIcon && <IconMedal size={size === "sm" ? 12 : size === "md" ? 14 : 16} />}
      {config.label}
    </span>
  );
}
