"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconMessageQuestion,
  IconCircleCheck,
  IconLoader2,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

/**
 * Panel para asesor/admin_nucleo: muestra solicitudes de revisión
 * pendientes de todos sus locales asignados y permite responderlas.
 */
export function RevisionesPanel() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [corregir, setCorregir] = useState<Record<string, boolean>>({});
  const [notas, setNotas] = useState<
    Record<string, { score_documentacion: number; score_condiciones: number; score_capacitaciones: number; score_tareas: number }>
  >({});

  const { data: revisiones, isLoading } = trpc.sellos.getRevisionesPendientes.useQuery();

  const resolver = trpc.sellos.resolverRevision.useMutation({
    onSuccess: () => {
      utils.sellos.getRevisionesPendientes.invalidate();
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#DDE3EA] p-5 animate-pulse">
        <div className="h-4 w-40 bg-[#DDE3EA] rounded mb-3" />
        <div className="h-16 bg-[#F4F6F3] rounded-xl" />
      </div>
    );
  }

  if (!revisiones || revisiones.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 bg-amber-50 border-b border-amber-100">
        <IconMessageQuestion size={18} className="text-amber-600" />
        <p className="font-semibold text-amber-900 text-sm">
          {revisiones.length} solicitud{revisiones.length > 1 ? "es" : ""} de revisión pendiente{revisiones.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {revisiones.map((rev) => {
          const isOpen = expandedId === rev.id;
          const respuesta = respuestas[rev.id] ?? "";
          const vaACorregir = corregir[rev.id] ?? false;
          const nota = notas[rev.id] ?? {
            score_documentacion: Math.round(rev.sello.score_documentacion),
            score_condiciones: Math.round(rev.sello.score_condiciones),
            score_capacitaciones: Math.round(rev.sello.score_capacitaciones),
            score_tareas: Math.round(rev.sello.score_tareas),
          };

          return (
            <div key={rev.id} className="p-4">
              <button
                onClick={() => setExpandedId(isOpen ? null : rev.id)}
                className="w-full flex items-start justify-between gap-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm text-[#0B1B33]">
                      {rev.sello.tenant.nombre}
                    </span>
                    <span className="text-xs text-[#5B6980] capitalize">
                      {rev.sello.periodo} · {rev.sello.nivel} ({Math.round(rev.sello.score_general)}%)
                    </span>
                  </div>
                  <p className="text-sm text-[#334155] line-clamp-2">{rev.motivo}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{formatDate(rev.created_at)}</p>
                </div>
                <span className="text-[#5B6980] shrink-0">
                  {isOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </span>
              </button>

              {isOpen && (
                <div className="mt-4 space-y-3">
                  <div className="bg-[#F8FAFC] rounded-xl p-3 text-sm text-[#334155]">
                    <p className="text-xs font-medium text-[#94A3B8] mb-1">Motivo completo</p>
                    {rev.motivo}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#5B6980] block mb-1.5">
                      Tu respuesta
                    </label>
                    <textarea
                      rows={3}
                      value={respuesta}
                      onChange={(e) =>
                        setRespuestas((prev) => ({ ...prev, [rev.id]: e.target.value }))
                      }
                      placeholder="Explica el resultado del sello y las acciones recomendadas..."
                      className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                    />
                  </div>

                  {resolver.error && resolver.variables?.revision_id === rev.id && (
                    <p className="text-xs text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                      {resolver.error.message}
                    </p>
                  )}

                  <label className="flex items-center gap-2 text-sm text-[#334155]">
                    <input
                      type="checkbox"
                      checked={vaACorregir}
                      onChange={(event) =>
                        setCorregir((prev) => ({ ...prev, [rev.id]: event.target.checked }))
                      }
                    />
                    Volver a emitir el sello con otras notas
                  </label>
                  {vaACorregir && (
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["score_documentacion", "Documentación"],
                          ["score_condiciones", "Controles"],
                          ["score_capacitaciones", "Capacitaciones"],
                          ["score_tareas", "Tareas"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="text-xs text-[#5B6980]">
                          {label}
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={nota[key]}
                            onChange={(event) =>
                              setNotas((prev) => ({
                                ...prev,
                                [rev.id]: { ...nota, [key]: Number(event.target.value) },
                              }))
                            }
                            className="mt-1 min-h-10 w-full rounded-lg border border-[#DDE3EA] px-2 text-sm text-[#0B1B33]"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  <Button
                    size="sm"
                    disabled={respuesta.trim().length < 5 || resolver.isPending}
                    onClick={() =>
                      resolver.mutate({
                        revision_id: rev.id,
                        respuesta: respuesta.trim(),
                        corregir: vaACorregir ? nota : undefined,
                      })
                    }
                    className="bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
                  >
                    {resolver.isPending && resolver.variables?.revision_id === rev.id ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconCircleCheck size={14} />
                    )}
                    Resolver revisión
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
