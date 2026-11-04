"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconMedal } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";
import { getCurrentPeriodo } from "@/lib/utils";
import { ETIQUETA_NIVEL_V2, type NivelSelloV2 } from "@/lib/sellos/v2";
import { LEYENDA_ALCANCE_SELLO } from "@/lib/declaraciones/textos";

interface Props {
  tenantId: string;
  puedeAprobar?: boolean;
}

export function EmitirSelloButton({ tenantId, puedeAprobar = false }: Props) {
  const [open, setOpen] = useState(false);
  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [motivo, setMotivo] = useState("");
  const router = useRouter();
  const utils = trpc.useUtils();

  const propuesta = trpc.sellos.propuesta.useQuery(
    { tenant_id: tenantId, periodo },
    { enabled: open && /^\d{4}-\d{2}$/.test(periodo) }
  );

  function refrescar() {
    void utils.sellos.getActual.invalidate();
    void utils.sellos.getHistorial.invalidate();
    void utils.sellos.listPropuestos.invalidate();
    router.refresh();
    setOpen(false);
  }

  const proponer = trpc.sellos.proponer.useMutation({ onSuccess: refrescar });
  const aprobar = trpc.sellos.aprobar.useMutation({ onSuccess: refrescar });
  const rechazar = trpc.sellos.rechazar.useMutation({ onSuccess: refrescar });

  const resultado = propuesta.data?.resultado;
  const nivel = (resultado?.nivel ?? "sin_sello") as NivelSelloV2;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 min-h-12 px-4 rounded-lg bg-[#0B1B33] text-sm font-medium text-white hover:bg-[#16294A]"
      >
        <IconMedal size={16} />
        {puedeAprobar ? "Proponer o aprobar sello" : "Proponer sello"}
      </button>
      <Dialogo abierto={open} titulo="Sello del período" onCerrar={() => setOpen(false)}>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-[#0B1B33]">Período</span>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3"
            />
          </label>
          {propuesta.isLoading && <p className="text-sm text-[#5B6980]">Calculando puntaje…</p>}
          {propuesta.error && <p className="text-sm text-red-600">{propuesta.error.message}</p>}
          {resultado && (
            <div className="rounded-xl border border-[#DDE3EA] p-4 space-y-2">
              <p className="text-3xl font-extrabold text-[#0B1B33]">{resultado.score_general.toFixed(1)}</p>
              <p className="text-sm font-semibold">{ETIQUETA_NIVEL_V2[nivel]}</p>
              <p className="text-xs text-[#5B6980]">
                Seguimiento {resultado.score_seguimiento} · Visita {resultado.score_visita}
                {resultado.bloqueo_critico ? " · Bloqueado por hallazgo crítico abierto" : ""}
              </p>
              <p className="text-xs text-[#5B6980]">{LEYENDA_ALCANCE_SELLO}</p>
            </div>
          )}
          {proponer.error && <p className="text-sm text-red-600">{proponer.error.message}</p>}
          {aprobar.error && <p className="text-sm text-red-600">{aprobar.error.message}</p>}
          {rechazar.error && <p className="text-sm text-red-600">{rechazar.error.message}</p>}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={proponer.isPending || !resultado}
              onClick={() => proponer.mutate({ tenant_id: tenantId, periodo })}
              className="min-h-12 rounded-lg bg-[#2F6B2A] text-white text-sm font-medium disabled:opacity-60"
            >
              {proponer.isPending ? "Guardando…" : "Proponer a la socia"}
            </button>
            {puedeAprobar && (
              <>
                <button
                  type="button"
                  disabled={aprobar.isPending || !resultado}
                  onClick={() => aprobar.mutate({ tenant_id: tenantId, periodo })}
                  className="min-h-12 rounded-lg bg-[#0B1B33] text-white text-sm font-medium disabled:opacity-60"
                >
                  Aprobar y emitir
                </button>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Motivo de rechazo (mínimo 5 caracteres)"
                  className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm"
                />
                <button
                  type="button"
                  disabled={rechazar.isPending || motivo.trim().length < 5}
                  onClick={() => rechazar.mutate({ tenant_id: tenantId, periodo, motivo })}
                  className="min-h-12 rounded-lg border border-[#B42318] text-[#B42318] text-sm font-medium disabled:opacity-60"
                >
                  Rechazar propuesta
                </button>
              </>
            )}
          </div>
        </div>
      </Dialogo>
    </>
  );
}
