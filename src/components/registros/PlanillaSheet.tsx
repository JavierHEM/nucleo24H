"use client";

import { useState } from "react";
import { IconChevronLeft, IconX } from "@tabler/icons-react";
import { FormPlanilla } from "@/components/registros/FormPlanilla";
import { trpc } from "@/lib/trpc/client";
import { FAMILIAS, getPlanilla, planillasDe, type FamiliaId, type Planilla } from "@/lib/bpm/planillas";

type PlanillaSheetProps = {
  abierto: boolean;
  onCerrar: () => void;
  codigo?: string | null;
  onSuccess?: () => void;
};

export function PlanillaSheet(props: PlanillaSheetProps) {
  if (!props.abierto) return null;
  return <PlanillaSheetAbierta key={props.codigo ?? "nueva"} {...props} />;
}

function PlanillaSheetAbierta({ abierto, onCerrar, codigo, onSuccess }: PlanillaSheetProps) {
  const inicial = codigo ? (getPlanilla(codigo) ?? null) : null;
  const [familia, setFamilia] = useState<FamiliaId | null>(inicial?.familia ?? null);
  const [planilla, setPlanilla] = useState<Planilla | null>(inicial);
  const contexto = trpc.registros.contexto.useQuery(undefined, { enabled: abierto });
  const programa = trpc.programa.actual.useQuery(undefined, { enabled: abierto });
  const fija = Boolean(codigo);
  const codigos = new Set((programa.data ?? []).filter((item) => item.activa).map((item) => item.codigo));
  const familias = FAMILIAS.filter((item) => planillasDe(item.id).some((planilla) => codigos.has(planilla.codigo)));

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={cerrar} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EA] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            {(familia || planilla) && (
              <button
                type="button"
                onClick={volver}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F6F3] text-[#5B6980]"
                aria-label="Volver"
              >
                <IconChevronLeft size={18} />
              </button>
            )}
            <p className="font-semibold text-[#0B1B33] text-sm truncate">{titulo}</p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F6F3] text-[#5B6980]"
            aria-label="Cerrar"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="p-5">
          {!familia && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {programa.isLoading && <p className="text-sm text-[#5B6980]">Cargando planillas…</p>}
              {programa.data && familias.length === 0 && (
                <p className="text-sm text-[#5B6980]">Este local no tiene planillas activas.</p>
              )}
              {familias.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFamilia(item.id)}
                  className="text-left p-4 rounded-xl border-2 border-[#DDE3EA] hover:border-[#2F6B2A] hover:bg-[#E5F1E3]/40"
                >
                  <p className="font-mono text-[11px] text-[#5B6980]">{item.procedimiento}</p>
                  <p className="font-semibold text-sm text-[#0B1B33] mt-1">{item.label}</p>
                </button>
              ))}
            </div>
          )}

          {familia && !planilla && (
            <div className="space-y-2">
              {planillasDe(familia)
                .filter((item) => codigos.has(item.codigo))
                .map((item) => (
                <button
                  key={item.codigo}
                  type="button"
                  onClick={() => setPlanilla(item)}
                  className="w-full text-left p-4 rounded-xl border border-[#DDE3EA] hover:border-[#2F6B2A]"
                >
                  <p className="font-mono text-[11px] text-[#5B6980]">{item.codigo}</p>
                  <p className="font-medium text-sm text-[#0B1B33] mt-0.5">{item.nombre}</p>
                  <p className="text-xs text-[#5B6980] mt-1">{item.frecuencia}</p>
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
