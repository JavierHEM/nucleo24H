import Link from "next/link";
import { IconAlertTriangle, IconCircleCheck, IconClock } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface Alerta {
  id: string;
  tipo: "vencido" | "proximo" | "ok";
  mensaje: string;
  href: string;
  fecha?: Date | string;
}

interface AlertasPanelProps {
  alertas: Alerta[];
}

const TIPO_CONFIG = {
  vencido: {
    icon: IconAlertTriangle,
    bg: "bg-red-50",
    border: "border-red-200",
    color: "text-[#DC2626]",
    label: "Vencido",
  },
  proximo: {
    icon: IconClock,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    color: "text-[#D97706]",
    label: "Próximo a vencer",
  },
  ok: {
    icon: IconCircleCheck,
    bg: "bg-[#EAF3E0]",
    border: "border-green-200",
    color: "text-[#16A34A]",
    label: "Al día",
  },
};

export function AlertasPanel({ alertas }: AlertasPanelProps) {
  const activas = alertas.filter((a) => a.tipo !== "ok");

  if (activas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#0D1F3C] mb-3">Alertas</p>
        <div className="flex items-center gap-3 text-sm text-[#16A34A]">
          <IconCircleCheck size={18} />
          <span>Todo en orden, sin alertas pendientes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#0D1F3C]">Alertas</p>
        <span className="text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5 font-medium">
          {activas.length}
        </span>
      </div>
      <div className="space-y-2">
        {activas.map((alerta) => {
          const config = TIPO_CONFIG[alerta.tipo];
          const Icon = config.icon;
          return (
            <Link
              key={alerta.id}
              href={alerta.href}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-sm transition-opacity hover:opacity-80",
                config.bg,
                config.border
              )}
            >
              <Icon size={16} className={cn("shrink-0 mt-0.5", config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-[#0D1F3C] font-medium leading-snug">{alerta.mensaje}</p>
                {alerta.fecha && (
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {formatDate(alerta.fecha)}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
