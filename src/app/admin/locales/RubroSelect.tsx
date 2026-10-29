"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { TIPOS_LOCAL, TIPO_LOCAL_LABEL, normalizarTipoLocal } from "@/lib/planes";

export function RubroSelect({ tenantId, tipoLocal }: { tenantId: string; tipoLocal: string }) {
  const router = useRouter();
  const actualizar = trpc.locales.actualizar.useMutation({ onSuccess: () => router.refresh() });

  return (
    <div>
      <label htmlFor={`rubro-${tenantId}`} className="sr-only">
        Tipo de local
      </label>
      <select
        id={`rubro-${tenantId}`}
        value={normalizarTipoLocal(tipoLocal)}
        disabled={actualizar.isPending}
        onChange={(event) =>
          actualizar.mutate({ id: tenantId, tipo_local: normalizarTipoLocal(event.target.value) })
        }
        className="text-xs rounded-md border border-[#DDE3EA] bg-white px-1.5 py-1 text-[#16294A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] disabled:opacity-50"
      >
        {TIPOS_LOCAL.map((tipo) => (
          <option key={tipo} value={tipo}>
            {TIPO_LOCAL_LABEL[tipo]}
          </option>
        ))}
      </select>
      {actualizar.error && <p className="text-[11px] text-[#B42318] mt-1">{actualizar.error.message}</p>}
    </div>
  );
}
