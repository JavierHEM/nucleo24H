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
  IconHandSanitizer,
  IconTruckDelivery,
  IconTrash,
  IconDroplet,
  IconToolsKitchen2,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FAMILIAS, etiquetaPlanilla, resumenRegistro, type FamiliaId } from "@/lib/bpm/planillas";
import { hrefArchivo } from "@/lib/storage/rutas";
import { ScoreCards } from "@/components/dashboard/ScoreCards";

type Tipo = FamiliaId | "temperatura";

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
  higiene: {
    label: "Higiene",
    icon: IconHandSanitizer,
    bg: "bg-[#E5F1E3]",
    text: "text-[#255620]",
    iconColor: "text-[#2F6B2A]",
  },
  recepcion: {
    label: "Recepción",
    icon: IconTruckDelivery,
    bg: "bg-[#F1F5F9]",
    text: "text-[#16294A]",
    iconColor: "text-[#16294A]",
  },
  almacenamiento: {
    label: "Almacenamiento",
    icon: IconTemperature,
    bg: "bg-blue-50",
    text: "text-blue-700",
    iconColor: "text-blue-500",
  },
  residuos: {
    label: "Residuos",
    icon: IconTrash,
    bg: "bg-[#F1F5F9]",
    text: "text-[#16294A]",
    iconColor: "text-[#16294A]",
  },
  agua: {
    label: "Agua",
    icon: IconDroplet,
    bg: "bg-blue-50",
    text: "text-blue-700",
    iconColor: "text-blue-500",
  },
  produccion: {
    label: "Producción",
    icon: IconToolsKitchen2,
    bg: "bg-[#E5F1E3]",
    text: "text-[#255620]",
    iconColor: "text-[#2F6B2A]",
  },
  limpieza: {
    label: "Limpieza",
    icon: IconDroplets,
    bg: "bg-[#E5F1E3]",
    text: "text-[#255620]",
    iconColor: "text-[#2F6B2A]",
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
  completo: { icon: IconCircleCheck, color: "text-[#2F6B2A]", label: "Completo" },
  pendiente: { icon: IconClock, color: "text-[#D97706]", label: "Pendiente" },
  observado: { icon: IconAlertTriangle, color: "text-[#B42318]", label: "Observado" },
};

const FILTROS: Array<{ value: FamiliaId | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  ...FAMILIAS.map((familia) => ({ value: familia.id, label: familia.label })),
];

export function RegistrosList() {
  const [filtro, setFiltro] = useState<FamiliaId | "todos">("todos");

  const { data, isLoading, error } = trpc.registros.list.useQuery({
    tipo: filtro === "todos" ? undefined : filtro,
    limit: 50,
  });
  const resumen = trpc.registros.list.useQuery({ limit: 100 });
  const filas = resumen.data ?? [];
  const hoy = new Date();
  const deHoy = filas.filter((registro) => {
    const fecha = new Date(registro.fecha);
    return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
  }).length;
  const delMes = filas.filter((registro) => {
    const fecha = new Date(registro.fecha);
    return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth();
  }).length;
  const enRevision = filas.filter((registro) => registro.origen === "papel" && registro.estado === "pendiente").length;
  const observados = filas.filter((registro) => registro.estado === "observado").length;

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#B42318]">
        Error al cargar registros: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resumen.data && (
        <ScoreCards
          items={[
            { label: "Hoy", value: deHoy, hint: "Registros del día", tone: deHoy > 0 ? "ok" : "alerta" },
            { label: "Este mes", value: delMes, hint: "En el período", tone: "neutral" },
            { label: "En revisión", value: enRevision, hint: "Planillas en papel", tone: enRevision > 0 ? "alerta" : "ok" },
            { label: "Observados", value: observados, hint: "Con hallazgo", tone: observados > 0 ? "alerta" : "ok" },
          ]}
        />
      )}
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <IconFilter size={15} className="text-[#5B6980] shrink-0" />
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={cn(
              "text-sm px-3 py-1.5 rounded-full border transition-colors",
              filtro === f.value
                ? "bg-[#16294A] text-white border-[#16294A]"
                : "bg-white text-[#334155] border-[#DDE3EA] hover:border-[#16294A] hover:text-[#16294A]"
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
            <div key={i} className="h-[72px] rounded-xl bg-[#DDE3EA] animate-pulse" />
          ))}
        </div>
      )}

      {/* Vacío */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <IconClipboardList size={36} className="mx-auto text-[#DDE3EA] mb-3" />
          <p className="font-medium text-[#0B1B33]">No hay registros aún</p>
          <p className="text-sm text-[#5B6980] mt-1">
            Completa una planilla en el sistema o carga la impresa.
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
            const datos = (registro.datos ?? {}) as Record<string, unknown>;
            const esPapel = registro.origen === "papel";
            const detalle = esPapel
              ? "Planilla impresa"
              : resumenRegistro(registro.codigo, registro.tipo, datos);
            const estadoLabel =
              esPapel && registro.estado === "pendiente" ? "En revisión" : estadoCfg.label;
            const titulo = etiquetaPlanilla(registro.codigo, registro.tipo);

            return (
              <div
                key={registro.id}
                className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm flex items-center gap-4 px-4 py-3 hover:shadow-md transition-shadow"
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
                    <p className="font-semibold text-sm text-[#0B1B33]">
                      {titulo}
                    </p>
                    {registro.codigo && (
                      <span className="font-mono text-[10px] text-[#5B6980]">{registro.codigo}</span>
                    )}
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
                  <p className="text-xs text-[#5B6980] mt-0.5 truncate">{detalle}</p>
                  {esPapel && registro.adjunto_url && (
                    <a
                      href={hrefArchivo(registro.adjunto_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#16294A] underline"
                    >
                      Ver planilla
                    </a>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-[#5B6980]">{formatDate(registro.fecha)}</p>
                  <div className={cn("flex items-center justify-end gap-1 mt-1", estadoCfg.color)}>
                    <EstadoIcon size={13} />
                    <span className="text-xs font-medium">{estadoLabel}</span>
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
