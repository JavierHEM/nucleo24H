"use client";

import { useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { FAMILIAS, getPlanilla } from "@/lib/bpm/planillas";
import { baseDelRubro, type AjustePrograma, type ItemPrograma } from "@/lib/bpm/programa";
import { TIPO_LOCAL_LABEL, type TipoLocal } from "@/lib/planes";

function aAjuste(item: ItemPrograma): AjustePrograma {
  return {
    codigo: item.codigo,
    activa: item.activa,
    modo: item.modo,
    momento: item.momento,
    cadencia: item.cadencia,
  };
}

export function ProgramaEditor({
  localNombre,
  tenantId,
  tipoLocal,
}: {
  localNombre: string | null;
  tenantId: string | null;
  tipoLocal: TipoLocal;
}) {
  const base = baseDelRubro(tipoLocal);
  const utils = trpc.useUtils();
  const actual = trpc.programa.actual.useQuery(tenantId ? { tenantId } : undefined, {
    enabled: Boolean(tenantId),
  });
  const guardar = trpc.programa.guardar.useMutation({
    onSuccess: async () => {
      await utils.programa.agenda.invalidate();
      await utils.programa.actual.invalidate();
      setEdiciones(null);
      setGuardado(true);
    },
  });
  const [ediciones, setEdiciones] = useState<AjustePrograma[] | null>(null);
  const [guardado, setGuardado] = useState(false);
  const ajustes = ediciones ?? actual.data?.map(aAjuste) ?? [];

  function actualizar(codigo: string, cambio: Partial<AjustePrograma>) {
    setGuardado(false);
    setEdiciones(ajustes.map((item) => (item.codigo === codigo ? { ...item, ...cambio } : item)));
  }

  const sinLocal = actual.error?.data?.code === "BAD_REQUEST";

  function aplicarBase() {
    if (!base) return;
    setGuardado(false);
    setEdiciones(ajustes.map((item) => ({ ...item, activa: base.has(item.codigo) })));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">
          {localNombre ? `Programa de ${localNombre}` : "Programa del local"}
        </h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Lo que dejes activo es lo que el equipo ve en la guía, en registros y en la biblioteca.
        </p>
      </div>

      {tenantId && (
        <div className="rounded-xl border border-[#DDE3EA] bg-white p-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#334155]">
            Rubro del local: <span className="font-semibold text-[#0B1B33]">{TIPO_LOCAL_LABEL[tipoLocal]}</span>
          </p>
          {base ? (
            <Button type="button" variant="outline" size="sm" onClick={aplicarBase} disabled={ajustes.length === 0}>
              Aplicar base del rubro
            </Button>
          ) : (
            <p className="text-xs text-[#5B6980]">Núcleo aún no definió una base para este rubro.</p>
          )}
        </div>
      )}

      {actual.isLoading && <p className="text-sm text-[#5B6980]">Cargando programa…</p>}
      {sinLocal && (
        <p className="text-sm text-[#5B6980] bg-white border border-[#DDE3EA] rounded-xl px-4 py-3">
          Elige un local para personalizar su programa.
        </p>
      )}
      {actual.error && !sinLocal && (
        <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2">{actual.error.message}</p>
      )}

      {FAMILIAS.map((familia) => {
        const items = ajustes.filter((item) => getPlanilla(item.codigo)?.familia === familia.id);
        if (items.length === 0) return null;
        return (
          <section key={familia.id} className="space-y-3">
            <h2 className="font-mono text-sm font-semibold text-[#0B1B33]">{familia.label}</h2>
            {items.map((item) => {
              const nombre = actual.data?.find((fila) => fila.codigo === item.codigo)?.nombre ?? item.codigo;
              return (
                <div key={item.codigo} className="rounded-xl border border-[#DDE3EA] bg-white p-3 space-y-3">
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
                        onChange={(event) =>
                          actualizar(item.codigo, { modo: event.target.value as AjustePrograma["modo"] })
                        }
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
          </section>
        );
      })}

      {guardar.error && <p className="text-sm text-[#B42318]">{guardar.error.message}</p>}
      {guardado && !guardar.isPending && (
        <p className="text-sm text-[#255620]">Programa guardado. El equipo ya ve este conjunto.</p>
      )}

      {ajustes.length > 0 && (
        <Button
          type="button"
          disabled={guardar.isPending}
          onClick={() => guardar.mutate({ ajustes })}
          className="min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white"
        >
          {guardar.isPending ? (
            <span className="inline-flex items-center gap-2">
              <IconLoader2 size={16} className="animate-spin" /> Guardando...
            </span>
          ) : (
            "Guardar programa"
          )}
        </Button>
      )}
    </div>
  );
}
