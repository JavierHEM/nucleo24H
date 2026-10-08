"use client";

import { useState } from "react";
import {
  IconFileDescription,
  IconExternalLink,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconX,
  IconCalendar,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { formatDate, getCurrentPeriodo, cn } from "@/lib/utils";
import { RevisarDocumentoButton } from "./RevisarDocumentoButton";
import { hrefArchivo } from "@/lib/storage/rutas";

const ESTADO_CONFIG = {
  pendiente: {
    label: "Pendiente",
    icon: IconClock,
    className: "bg-yellow-100 text-yellow-800",
  },
  aprobado: {
    label: "Aprobado",
    icon: IconCircleCheck,
    className: "bg-green-100 text-green-800",
  },
  observado: {
    label: "Observado",
    icon: IconAlertTriangle,
    className: "bg-orange-100 text-orange-800",
  },
  rechazado: {
    label: "Rechazado",
    icon: IconX,
    className: "bg-red-100 text-red-800",
  },
} as const;

type EstadoKey = keyof typeof ESTADO_CONFIG;

interface Props {
  userRole?: string | null;
}

export function DocumentosList({ userRole }: Props) {
  const [mes, setMes] = useState<string>(getCurrentPeriodo());
  const { data, isLoading } = trpc.documentos.list.useQuery({ mes });

  return (
    <div className="space-y-4">
      {/* Filtro de período */}
      <div className="flex items-center gap-2">
        <IconCalendar size={16} className="text-[#64748B] shrink-0" />
        <label className="text-sm font-medium text-[#334155]">Período:</label>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="h-9 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]/40"
        />
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center mx-auto mb-3">
            <IconFileDescription size={24} className="text-[#94A3B8]" />
          </div>
          <p className="font-semibold text-[#0B2545]">Sin documentos para este período</p>
          <p className="text-sm text-[#64748B] mt-1">
            Sube documentos con el botón &ldquo;Subir documento&rdquo;.
          </p>
        </div>
      )}

      {/* Lista de documentos */}
      {data && data.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          {/* Header — solo desktop */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-[#F8F9FA] border-b border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#64748B]">Nombre</span>
            <span className="text-xs font-semibold text-[#64748B]">Categoría</span>
            <span className="text-xs font-semibold text-[#64748B]">Vencimiento</span>
            <span className="text-xs font-semibold text-[#64748B]">Estado</span>
            <span />
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {data.map((doc) => {
              const estadoKey = (doc.estado as EstadoKey) in ESTADO_CONFIG
                ? (doc.estado as EstadoKey)
                : "pendiente";
              const estado = ESTADO_CONFIG[estadoKey];
              const EstadoIcon = estado.icon;
              const vencido = doc.vencimiento && new Date(doc.vencimiento) < new Date();

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  {/* Ícono */}
                  <div className="w-9 h-9 rounded-lg bg-[#F8F9FA] flex items-center justify-center shrink-0">
                    <IconFileDescription size={18} className="text-[#64748B]" />
                  </div>

                  {/* Nombre + observación */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B2545] truncate">{doc.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#94A3B8]">{doc.categoria}</span>
                      {doc.observacion && (
                        <span className="text-xs text-orange-600 truncate max-w-[160px]">
                          {doc.observacion}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vencimiento */}
                  {doc.vencimiento && (
                    <span
                      className={cn(
                        "text-xs hidden sm:block shrink-0",
                        vencido ? "text-[#DC2626] font-semibold" : "text-[#64748B]"
                      )}
                    >
                      {vencido && "⚠ "}{formatDate(doc.vencimiento)}
                    </span>
                  )}

                  {/* Estado badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
                      estado.className
                    )}
                  >
                    <EstadoIcon size={11} />
                    <span className="hidden sm:inline">{estado.label}</span>
                  </span>

                  {/* Botón de revisión — solo asesores */}
                  {(userRole === "asesor" || userRole === "admin_nucleo") && (
                    <RevisarDocumentoButton
                      docId={doc.id}
                      docNombre={doc.nombre}
                      estadoActual={doc.estado}
                    />
                  )}

                  {/* Link al archivo */}
                  <a
                    href={hrefArchivo(doc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#4B8B2E] hover:bg-[#EBF5E6] transition-colors shrink-0"
                    title="Abrir documento"
                  >
                    <IconExternalLink size={15} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
