"use client";

import { useState } from "react";
import { IconLoader2, IconRepeat } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";
import { formatCLP } from "@/lib/utils";

export function ActivarDebitoButton({
  monto,
  diaCobro,
  pendiente,
}: {
  monto: number;
  diaCobro: number;
  pendiente: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [autoriza, setAutoriza] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activar = trpc.pagos.activarDebito.useMutation({
    onSuccess: ({ redirectUrl }) => {
      window.location.href = redirectUrl;
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setAutoriza(false);
          setAbierto(true);
        }}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#2F6B2A] text-[#255620] hover:bg-[#E5F1E3] transition-colors min-h-12"
      >
        <IconRepeat size={18} />
        {pendiente ? "Continuar autorización" : "Activar débito automático"}
      </button>
      <Dialogo abierto={abierto} titulo="Débito automático" onCerrar={() => setAbierto(false)}>
        <div className="space-y-3 text-sm text-[#334155]">
          <p>
            Te llevamos a Mercado Pago para autorizar el cargo mensual de{" "}
            <span className="font-medium text-[#0B1B33]">{formatCLP(monto)}</span> el día {diaCobro} de
            cada mes. Si este mes ya está pagado, el primer débito es el mes siguiente.
          </p>
          <p>Puedes volver al pago mensual cuando quieras. No hay devolución proporcional.</p>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={autoriza}
              onChange={(e) => setAutoriza(e.target.checked)}
              className="mt-1"
            />
            Autorizo el cargo automático mensual de {formatCLP(monto)} el día {diaCobro} de cada mes.
          </label>
          {(error || activar.error) && (
            <p className="text-red-600">{error ?? activar.error?.message}</p>
          )}
          <button
            type="button"
            disabled={!autoriza || activar.isPending}
            onClick={() => {
              setError(null);
              activar.mutate({ autoriza_debito: true });
            }}
            className="w-full min-h-12 rounded-lg bg-[#2F6B2A] text-white disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {activar.isPending ? <IconLoader2 size={18} className="animate-spin" /> : null}
            Ir a Mercado Pago
          </button>
        </div>
      </Dialogo>
    </>
  );
}
