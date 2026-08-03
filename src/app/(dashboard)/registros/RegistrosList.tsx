"use client";

import { useState } from "react";
import {
  IconTemperature,
  IconDroplets,
  IconBug,
  IconSchool,
  IconFilter,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconClipboardList,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tipo = "temperatura" | "limpieza" | "plagas" | "capacitacion";

const TIPO_CONFIG: Record<
  Tipo,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    bg: string;
    text: string;
    iconColor: string;
  }
> = {
  temperatura: {
    label: "Temperatura",
    icon: IconTemperature,
    bg: "bg-blue-50",
    text: "text-blue-700",
    iconColor: "text-blue-500",
  },
  limpieza: {
    label: "Limpieza",
    icon: IconDroplets,
    bg: "bg-[#EBF5E6]",
    text: "text-[#3A6E24]",
    iconColor: "text-[#4B8B2E]",
  },
  plagas: {
    label: "Plagas",
    icon: IconBug,
    bg: "bg-amber-50",
    text: "text-amber-700",
    iconColor: "text-amber-500",
  },
  capacitacion: {
    label: "Capacitación",
    icon: IconSchool,
    bg: "bg-purple-50",
    text: "text-purple-700",
    iconColor: "text-purple-500",
  },
};

const ESTADO_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; label: string }
> = {
  completo: { icon: IconCircleCheck, color: "text-[#16A34A]", label: "Completo" },
  pendiente: { icon: IconClock, color: "text-[#D97706]", label: "Pendiente" },
  observado: { icon: IconAlertTriangle, color: "text-[#DC2626]", label: "Observado" },
};

const FILTROS: Array<{ value: Tipo | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "temperatura", label: "Temperatura" },
  { value: "limpieza", label: "Limpieza" },
  { value: "plagas", label: "Plagas" },
  { value: "capacitacion", label: "Capacitaciones" },
];

export function RegistrosList() {
  const [filtro, setFiltro] = useState<Tipo | "todos">("todos");

  const { data, isLoading, error } = trpc.registros.list.useQuery({
    tipo: filtro === "todos" ? undefined : filtro,
    limit: 50,
  });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#DC2626]">
        Error al cargar registros: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <IconFilter size={15} className="text-[#64748B] shrink-0" />
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={cn(
              "text-sm px-3 py-1.5 rounded-full border transition-colors",
              filtro === f.value
                ? "bg-[#143556] text-white border-[#143556]"
                : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#143556] hover:text-[#143556]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      )}

      {/* Vacío */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
          <IconClipboardList size={36} className="mx-auto text-[#E2E8F0] mb-3" />
          <p className="font-medium text-[#0B2545]">No hay registros aún</p>
          <p className="text-sm text-[#64748B] mt-1">
            Usa el botón &ldquo;Nuevo registro&rdquo; para comenzar.
          </p>
        </div>
      )}

      {/* Lista */}
      {data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((registro) => {
            const config =
              TIPO_CONFIG[registro.tipo as Tipo] ?? TIPO_CONFIG.temperatura;
            const Icon = config.icon;
            const estadoCfg =
              ESTADO_CONFIG[registro.estado] ?? ESTADO_CONFIG.pendiente;
            const EstadoIcon = estadoCfg.icon;
            const datos = registro.datos as Record<string, unknown>;

            let detalle = "";
            if (registro.tipo === "temperatura") {
              detalle = `Ingreso ${String(datos.temperatura_ingreso ?? "-")}°C · Almac. ${String(datos.temperatura_almacenamiento ?? "-")}°C`;
            } else if (registro.tipo === "limpieza") {
              detalle = `${String(datos.area ?? "")} · ${String(datos.producto_utilizado ?? "")}`;
            } else if (registro.tipo === "plagas") {
              detalle = `${String(datos.tipo_servicio ?? "")} · ${String(datos.empresa_fumigadora ?? "")}`;
            } else if (registro.tipo === "capacitacion") {
              detalle = `${String(datos.tema ?? "")} · ${String(datos.asistentes ?? "-")} asistentes`;
            }

            return (
              <div
                key={registro.id}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4 px-4 py-3 hover:shadow-md transition-shadow"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    config.bg
                  )}
                >
                  <Icon size={20} className={config.iconColor} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[#0B2545]">
                      {config.label}
                    </p>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        config.bg,
                        config.text
                      )}
                    >
                      {registro.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">{detalle}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-[#64748B]">{formatDate(registro.fecha)}</p>
                  <div className={cn("flex items-center justify-end gap-1 mt-1", estadoCfg.color)}>
                    <EstadoIcon size={13} />
                    <span className="text-xs font-medium">{estadoCfg.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
