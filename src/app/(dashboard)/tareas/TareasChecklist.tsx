"use client";

import { useState } from "react";
import {
  IconCircleCheck,
  IconCircle,
  IconLoader2,
  IconChevronDown,
  IconChevronUp,
  IconArchive,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface Props {
  userRole: string | null;
}

export function TareasChecklist({ userRole }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const { data: tareas, isLoading } = trpc.tareas.list.useQuery({});

  const completar = trpc.tareas.completar.useMutation({
    onSuccess: () => utils.tareas.list.invalidate(),
  });

  const descompletar = trpc.tareas.descompletar.useMutation({
    onSuccess: () => utils.tareas.list.invalidate(),
  });

  const archivar = trpc.tareas.archivar.useMutation({
    onSuccess: () => utils.tareas.list.invalidate(),
  });

  const isAdmin =
    userRole === "admin_local" ||
    userRole === "asesor" ||
    userRole === "admin_nucleo";

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-[#E2E8F0] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tareas || tareas.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-10 text-center">
        <IconCircle size={32} className="mx-auto text-[#E2E8F0] mb-3" />
        <p className="font-medium text-[#0B2545]">Sin tareas configuradas</p>
        <p className="text-sm text-[#64748B] mt-1">
          {userRole === "admin_local" || userRole === "admin_nucleo"
            ? "Usa el botón \"Nueva tarea\" para crear el checklist del local."
            : "El administrador del local configurará las tareas diarias."}
        </p>
      </div>
    );
  }

  const completadas = tareas.filter((t) => t.completadaHoy).length;
  const progreso = Math.round((completadas / tareas.length) * 100);

  return (
    <div className="space-y-4">
      {/* Barra de progreso del día */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#0B2545]">Progreso del día</p>
          <span
            className={cn(
              "text-sm font-bold",
              progreso === 100 ? "text-[#16A34A]" : "text-[#143556]"
            )}
          >
            {completadas}/{tareas.length}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#E2E8F0] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progreso === 100 ? "bg-[#16A34A]" : "bg-[#143556]"
            )}
            style={{ width: `${progreso}%` }}
          />
        </div>
        {progreso === 100 && (
          <p className="text-xs text-[#16A34A] font-medium mt-2 flex items-center gap-1">
            <IconCircleCheck size={14} />
            ¡Todas las tareas completadas!
          </p>
        )}
      </div>

      {/* Lista de tareas */}
      <div className="space-y-2">
        {tareas.map((tarea) => {
          const isExpanded = expandedId === tarea.id;
          const isPending =
            completar.isPending && completar.variables?.tarea_id === tarea.id ||
            descompletar.isPending && descompletar.variables?.tarea_id === tarea.id;

          return (
            <div
              key={tarea.id}
              className={cn(
                "bg-white rounded-xl border transition-all",
                tarea.completadaHoy
                  ? "border-[#16A34A]/30 bg-[#EBF5E6]/30"
                  : "border-[#E2E8F0]"
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Checkbox */}
                <button
                  onClick={() => {
                    if (tarea.completadaHoy) {
                      descompletar.mutate({ tarea_id: tarea.id });
                    } else {
                      completar.mutate({
                        tarea_id: tarea.id,
                        observacion: observaciones[tarea.id] || undefined,
                      });
                    }
                  }}
                  disabled={isPending}
                  className="shrink-0"
                >
                  {isPending ? (
                    <IconLoader2 size={22} className="text-[#4B8B2E] animate-spin" />
                  ) : tarea.completadaHoy ? (
                    <IconCircleCheck size={22} className="text-[#16A34A]" />
                  ) : (
                    <IconCircle size={22} className="text-[#CBD5E1] hover:text-[#4B8B2E] transition-colors" />
                  )}
                </button>

                {/* Título */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-snug",
                      tarea.completadaHoy
                        ? "text-[#64748B] line-through"
                        : "text-[#0B2545]"
                    )}
                  >
                    {tarea.titulo}
                  </p>
                  {tarea.completacion && (
                    <p className="text-xs text-[#16A34A] mt-0.5">
                      Completada a las{" "}
                      {new Date(tarea.completacion.fecha).toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>

                {/* Expandir descripción/observación */}
                {(tarea.descripcion || !tarea.completadaHoy) && (
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : tarea.id)
                    }
                    className="text-[#94A3B8] hover:text-[#64748B] shrink-0"
                  >
                    {isExpanded ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </button>
                )}
              </div>

              {/* Panel expandido */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-0 border-t border-[#E2E8F0] space-y-2">
                  {tarea.descripcion && (
                    <p className="text-xs text-[#64748B] pt-2">{tarea.descripcion}</p>
                  )}
                  {!tarea.completadaHoy && (
                    <div>
                      <input
                        type="text"
                        placeholder="Observación (opcional)"
                        value={observaciones[tarea.id] ?? ""}
                        onChange={(e) =>
                          setObservaciones((prev) => ({
                            ...prev,
                            [tarea.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]"
                      />
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Archivar la tarea "${tarea.titulo}"? Dejará de aparecer en el checklist.`)) {
                          archivar.mutate({ tarea_id: tarea.id });
                        }
                      }}
                      disabled={archivar.isPending && archivar.variables?.tarea_id === tarea.id}
                      className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#DC2626] transition-colors mt-1"
                    >
                      <IconArchive size={13} />
                      Archivar tarea
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
