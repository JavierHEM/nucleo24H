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
import { esRolGestion, puedeOperarLocal } from "@/lib/roles";
import { ScoreCards } from "@/components/dashboard/ScoreCards";

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

  const isAdmin = esRolGestion(userRole);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-[#DDE3EA] animate-pulse" />
        ))}
      </div>
    );
  }

  const completadas = tareas?.filter((t) => t.completadaHoy).length ?? 0;
  const total = tareas?.length ?? 0;
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const scores = (
    <ScoreCards
      items={[
        { label: "Hechas hoy", value: completadas, hint: total > 0 ? `de ${total}` : "Sin tareas", tone: total > 0 && completadas === total ? "ok" : "neutral" },
        { label: "Pendientes", value: Math.max(total - completadas, 0), hint: "Del checklist", tone: total > completadas ? "alerta" : "ok" },
        { label: "Avance", value: `${progreso}%`, hint: "Del día", tone: progreso === 100 ? "ok" : "neutral" },
        { label: "Activas", value: total, hint: "Configuradas en el local", tone: "neutral" },
      ]}
    />
  );

  if (!tareas || tareas.length === 0) {
    return (
      <div className="space-y-4">
        {scores}
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-10 text-center">
          <IconCircle size={32} className="mx-auto text-[#DDE3EA] mb-3" />
          <p className="font-medium text-[#0B1B33]">Sin tareas configuradas</p>
          <p className="text-sm text-[#5B6980] mt-1">
            {puedeOperarLocal(userRole)
              ? "Usa el botón \"Nueva tarea\" para crear el checklist del local."
              : "El administrador del local configurará las tareas diarias."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scores}
      {/* Barra de progreso del día */}
      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#0B1B33]">Progreso del día</p>
          <span
            className={cn(
              "text-sm font-bold",
              progreso === 100 ? "text-[#2F6B2A]" : "text-[#16294A]"
            )}
          >
            {completadas}/{tareas.length}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#DDE3EA] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progreso === 100 ? "bg-[#2F6B2A]" : "bg-[#16294A]"
            )}
            style={{ width: `${progreso}%` }}
          />
        </div>
        {progreso === 100 && (
          <p className="text-xs text-[#2F6B2A] font-medium mt-2 flex items-center gap-1">
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
                  ? "border-[#2F6B2A]/30 bg-[#E5F1E3]/30"
                  : "border-[#DDE3EA]"
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
                    <IconLoader2 size={22} className="text-[#2F6B2A] animate-spin" />
                  ) : tarea.completadaHoy ? (
                    <IconCircleCheck size={22} className="text-[#2F6B2A]" />
                  ) : (
                    <IconCircle size={22} className="text-[#CBD5E1] hover:text-[#2F6B2A] transition-colors" />
                  )}
                </button>

                {/* Título */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-snug",
                      tarea.completadaHoy
                        ? "text-[#5B6980] line-through"
                        : "text-[#0B1B33]"
                    )}
                  >
                    {tarea.titulo}
                  </p>
                  {tarea.completacion && (
                    <p className="text-xs text-[#2F6B2A] mt-0.5">
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
                    className="text-[#94A3B8] hover:text-[#5B6980] shrink-0"
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
                <div className="px-4 pb-3 pt-0 border-t border-[#DDE3EA] space-y-2">
                  {tarea.descripcion && (
                    <p className="text-xs text-[#5B6980] pt-2">{tarea.descripcion}</p>
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
                        className="w-full rounded-lg border border-[#DDE3EA] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
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
                      className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#B42318] transition-colors mt-1"
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
