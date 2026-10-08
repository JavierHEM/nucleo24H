"use client";

import { useEffect, useState } from "react";
import { IconChevronLeft, IconX } from "@tabler/icons-react";
import { FormPlanilla } from "@/components/registros/FormPlanilla";
import { trpc } from "@/lib/trpc/client";
import { FAMILIAS, getPlanilla, planillasDe, type FamiliaId, type Planilla } from "@/lib/bpm/planillas";

export function PlanillaSheet({
  abierto,
  onCerrar,
  codigo,
  onSuccess,
}: {
  abierto: boolean;
  onCerrar: () => void;
  codigo?: string | null;
  onSuccess?: () => void;
}) {
  const [familia, setFamilia] = useState<FamiliaId | null>(null);
  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const contexto = trpc.registros.contexto.useQuery(undefined, { enabled: abierto });
  const fija = Boolean(codigo);

  useEffect(() => {
    if (!abierto) {
      setFamilia(null);
      setPlanilla(null);
      return;
    }
    if (!codigo) return;
    const encontrada = getPlanilla(codigo) ?? null;
    setPlanilla(encontrada);
    setFamilia(encontrada?.familia ?? null);
  }, [abierto, codigo]);

  function cerrar() {
    onCerrar();
  }

  function volver() {
    if (fija) {
      cerrar();
      return;
    }
    if (planilla) {
      setPlanilla(null);
      return;
    }
    setFamilia(null);
  }

  const titulo = planilla
    ? planilla.nombre
    : familia
      ? FAMILIAS.find((item) => item.id === familia)?.label
      : "Nueva planilla";

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={cerrar} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            {(familia || planilla) && (
              <button
                type="button"
                onClick={volver}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F8F9FA] text-[#64748B]"
                aria-label="Volver"
              >
                <IconChevronLeft size={18} />
              </button>
            )}
            <p className="font-semibold text-[#0B2545] text-sm truncate">{titulo}</p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F8F9FA] text-[#64748B]"
            aria-label="Cerrar"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="p-5">
          {!familia && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FAMILIAS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFamilia(item.id)}
                  className="text-left p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#4B8B2E] hover:bg-[#EBF5E6]/40"
                >
                  <p className="font-mono text-[11px] text-[#64748B]">{item.procedimiento}</p>
                  <p className="font-semibold text-sm text-[#0B2545] mt-1">{item.label}</p>
                </button>
              ))}
            </div>
          )}

          {familia && !planilla && (
            <div className="space-y-2">
              {planillasDe(familia).map((item) => (
                <button
                  key={item.codigo}
                  type="button"
                  onClick={() => setPlanilla(item)}
                  className="w-full text-left p-4 rounded-xl border border-[#E2E8F0] hover:border-[#4B8B2E]"
                >
                  <p className="font-mono text-[11px] text-[#64748B]">{item.codigo}</p>
                  <p className="font-medium text-sm text-[#0B2545] mt-0.5">{item.nombre}</p>
                  <p className="text-xs text-[#64748B] mt-1">{item.frecuencia}</p>
                </button>
              ))}
            </div>
          )}

          {planilla && (
            <FormPlanilla
              planilla={planilla}
              equipos={contexto.data?.equipos ?? []}
              areas={contexto.data?.areas ?? []}
              onSuccess={() => {
                onSuccess?.();
                cerrar();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
