"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { ETIQUETA_NIVEL_V2, type NivelSelloV2 } from "@/lib/sellos/v2";

export function ColaPropuestos() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const list = trpc.sellos.listPropuestos.useQuery();
  const aprobar = trpc.sellos.aprobar.useMutation({
    onSuccess: () => {
      void utils.sellos.listPropuestos.invalidate();
      router.refresh();
    },
  });

  if (!list.data || list.data.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-[#DDE3EA] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[#0B1B33]">Propuestas pendientes de aprobación</h2>
      {list.data.map((sello) => (
        <div key={sello.id} className="flex items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-medium">{sello.tenant.nombre}</p>
            <p className="text-xs text-[#5B6980]">
              {sello.periodo} · {ETIQUETA_NIVEL_V2[sello.nivel as NivelSelloV2] ?? sello.nivel} ·{" "}
              {Math.round(sello.score_general)} pts
            </p>
          </div>
          <button
            type="button"
            disabled={aprobar.isPending}
            onClick={() => aprobar.mutate({ tenant_id: sello.tenant_id, periodo: sello.periodo })}
            className="min-h-10 px-3 rounded-lg bg-[#0B1B33] text-white text-xs font-medium"
          >
            Aprobar
          </button>
        </div>
      ))}
      {aprobar.error && <p className="text-sm text-red-600">{aprobar.error.message}</p>}
    </section>
  );
}
