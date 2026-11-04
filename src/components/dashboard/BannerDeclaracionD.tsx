"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { CasillaDeclaracion } from "@/components/declaraciones/CasillaDeclaracion";

export function BannerDeclaracionD() {
  const pendiente = trpc.declaraciones.pendienteD.useQuery();
  const aceptar = trpc.declaraciones.aceptarD.useMutation({
    onSuccess: () => void pendiente.refetch(),
  });
  const [checked, setChecked] = useState(false);

  if (!pendiente.data?.pendiente) return null;

  return (
    <div className="mt-3 rounded-xl border border-[#DDE3EA] bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-[#0B1B33]">Aceptación del servicio</p>
      <CasillaDeclaracion tipo="D" checked={checked} onChange={setChecked} />
      {aceptar.error && <p className="text-sm text-red-600">{aceptar.error.message}</p>}
      <button
        type="button"
        disabled={!checked || aceptar.isPending}
        onClick={() => aceptar.mutate({ acepta: true })}
        className="min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-white text-sm disabled:opacity-60"
      >
        Aceptar
      </button>
    </div>
  );
}
