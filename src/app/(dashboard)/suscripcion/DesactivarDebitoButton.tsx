"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";

export function DesactivarDebitoButton() {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const desactivar = trpc.pagos.desactivarDebito.useMutation({
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
        className="text-sm font-medium text-[#16294A] underline underline-offset-2"
      >
        Volver a pago mensual
      </button>
      <Dialogo abierto={abierto} titulo="Volver a pago mensual" onCerrar={() => setAbierto(false)}>
        <div className="space-y-3 text-sm text-[#334155]">
          <p>
            Pausamos el cargo automático en Mercado Pago. La suscripción sigue vigente: el próximo
            mes pagas a mano, o con transferencia si lo registra casa central.
          </p>
          {desactivar.error && <p className="text-red-600">{desactivar.error.message}</p>}
          <button
            type="button"
            disabled={desactivar.isPending}
            onClick={() => desactivar.mutate()}
            className="w-full min-h-12 rounded-lg bg-[#16294A] text-white disabled:opacity-60"
          >
            Confirmar
          </button>
        </div>
      </Dialogo>
    </>
  );
}
