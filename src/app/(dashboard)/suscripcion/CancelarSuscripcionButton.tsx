"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";

export function CancelarSuscripcionButton() {
  const [abierto, setAbierto] = useState(false);
  const [confirma, setConfirma] = useState(false);
  const router = useRouter();
  const cancelar = trpc.pagos.cancelar.useMutation({
    onSuccess: () => {
      setAbierto(false);
      router.refresh();
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm font-medium text-[#9A1C12] underline underline-offset-2"
      >
        Cancelar suscripción
      </button>
      <Dialogo abierto={abierto} titulo="Cancelar suscripción" onCerrar={() => setAbierto(false)}>
        <div className="space-y-3 text-sm text-[#334155]">
          <p>
            Al cancelar, dejas de renovar. Si tienes débito automático, también lo cortamos en Mercado Pago. Conservas
            acceso completo hasta el fin del período ya pagado; después la cuenta queda en solo lectura y el sello
            público deja de mostrarse.
          </p>
          <p>No hay devolución proporcional.</p>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={confirma} onChange={(e) => setConfirma(e.target.checked)} className="mt-1" />
            Entiendo que no hay devolución y que el sello dejará de estar vigente al terminar el período pagado.
          </label>
          {cancelar.error && <p className="text-red-600">{cancelar.error.message}</p>}
          <button
            type="button"
            disabled={!confirma || cancelar.isPending}
            onClick={() => cancelar.mutate()}
            className="w-full min-h-12 rounded-lg bg-[#9A1C12] text-white disabled:opacity-60"
          >
            Confirmar cancelación
          </button>
        </div>
      </Dialogo>
    </>
  );
}
