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
    color: "text-[#9A1C12]",
    bg: "bg-[#FCE4E1] text-[#9A1C12]",
    bgCard: "bg-[#FCE4E1]",
    border: "border-l-[#B42318]",
    progressBar: "bg-[#B42318]",
  },
  intermedio: {
    label: "Intermedio",
    color: "text-[#7A5000]",
    bg: "bg-[#FCF0D0] text-[#7A5000]",
    bgCard: "bg-[#FCF0D0]",
    border: "border-l-[#E8B100]",
    progressBar: "bg-[#E8B100]",
  },
  avanzado: {
    label: "Avanzado",
    color: "text-[#255620]",
    bg: "bg-[#E5F1E3] text-[#255620]",
    bgCard: "bg-[#E5F1E3]",
    border: "border-l-[#2F6B2A]",
    progressBar: "bg-[#2F6B2A]",
  },
  premium: {
    label: "Premium",
    color: "text-[#E3B341]",
    bg: "bg-[#0B1B33] text-[#E3B341]",
    bgCard: "bg-[#0B1B33]",
    border: "border-l-[#E3B341]",
    progressBar: "bg-[#E3B341]",
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
