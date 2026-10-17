"use client";

import { useEffect, useState } from "react";
import { IconX, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import type { AjustePrograma, ItemPrograma } from "@/lib/bpm/programa";

function aAjuste(item: ItemPrograma): AjustePrograma {
  return {
    codigo: item.codigo,
    activa: item.activa,
    modo: item.modo,
    momento: item.momento,
    cadencia: item.cadencia,
  };
}

export function AjustarProgramaSheet({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const utils = trpc.useUtils();
  const actual = trpc.programa.actual.useQuery(undefined, { enabled: abierto });
  const guardar = trpc.programa.guardar.useMutation({
    onSuccess: async () => {
      await utils.programa.agenda.invalidate();
      await utils.programa.actual.invalidate();
      onCerrar();
    },
  });
  const [ajustes, setAjustes] = useState<AjustePrograma[]>([]);

  useEffect(() => {
    if (actual.data) setAjustes(actual.data.map(aAjuste));
  }, [actual.data]);

  if (!abierto) return null;

  function actualizar(codigo: string, cambio: Partial<AjustePrograma>) {
    setAjustes((prev) => prev.map((item) => (item.codigo === codigo ? { ...item, ...cambio } : item)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EA] sticky top-0 bg-white z-10">
          <div>
            <p className="font-semibold text-[#0B1B33] text-sm">Programa del local</p>
            <p className="text-xs text-[#5B6980] mt-0.5">Elige qué controles aparecen en el día.</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F6F3] text-[#5B6980]"
            aria-label="Cerrar"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {actual.isLoading && <p className="text-sm text-[#5B6980]">Cargando programa…</p>}
          {ajustes.map((item) => {
            const nombre = actual.data?.find((fila) => fila.codigo === item.codigo)?.nombre ?? item.codigo;
            return (
              <div key={item.codigo} className="rounded-xl border border-[#DDE3EA] p-3 space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={item.activa}
                    onChange={(event) => actualizar(item.codigo, { activa: event.target.checked })}
                  />
                  <span>
                    <span className="block text-sm font-medium text-[#0B1B33]">{nombre}</span>
                    <span className="block font-mono text-[11px] text-[#5B6980]">{item.codigo}</span>
                  </span>
                </label>
                {item.activa && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      aria-label={`Cuándo aplica ${nombre}`}
                      className="min-h-10 rounded-lg border border-[#DDE3EA] px-2 text-sm"
                      value={item.modo}
                      onChange={(event) => actualizar(item.codigo, { modo: event.target.value as AjustePrograma["modo"] })}
                    >
                      <option value="turno">En el día</option>
                      <option value="evento">Solo si pasa</option>
                    </select>
                    <select
                      aria-label={`Momento de ${nombre}`}
                      className="min-h-10 rounded-lg border border-[#DDE3EA] px-2 text-sm"
                      value={item.momento}
                      disabled={item.modo === "evento"}
                      onChange={(event) =>
                        actualizar(item.codigo, { momento: event.target.value as AjustePrograma["momento"] })
                      }
                    >
                      <option value="inicio">Al inicio</option>
                      <option value="durante">Durante el turno</option>
                      <option value="cierre">Al cierre</option>
                    </select>
                    <select
                      aria-label={`Frecuencia de ${nombre}`}
                      className="min-h-10 rounded-lg border border-[#DDE3EA] px-2 text-sm"
                      value={item.cadencia}
                      disabled={item.modo === "evento"}
                      onChange={(event) =>
                        actualizar(item.codigo, { cadencia: event.target.value as AjustePrograma["cadencia"] })
                      }
                    >
                      <option value="dia">Cada día</option>
                      <option value="semana">Cada semana</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}

          {guardar.error && (
            <p className="text-sm text-[#B42318]">{guardar.error.message}</p>
          )}

          <Button
            type="button"
            disabled={guardar.isPending || ajustes.length === 0}
            onClick={() => guardar.mutate({ ajustes })}
            className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white"
          >
            {guardar.isPending ? (
              <span className="inline-flex items-center gap-2">
                <IconLoader2 size={16} className="animate-spin" /> Guardando...
              </span>
            ) : (
              "Guardar programa"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
