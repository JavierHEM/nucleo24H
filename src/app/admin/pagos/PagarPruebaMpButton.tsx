"use client";

import { useState } from "react";
import { IconCreditCard, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { formatCLP } from "@/lib/utils";
import { MONTO_PRUEBA_MP_NUCLEO_CLP, pruebaMpNucleoActiva } from "@/lib/payments/pruebaNucleo";

export function PagarPruebaMpButton({
  tenantId,
  periodo,
}: {
  tenantId: string;
  periodo: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const pagar = trpc.pagos.pagarMercadoPagoNucleo.useMutation({
    onSuccess: ({ redirectUrl }) => {
      window.location.href = redirectUrl;
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (!pruebaMpNucleoActiva() || MONTO_PRUEBA_MP_NUCLEO_CLP == null) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setError(null);
          pagar.mutate({ tenant_id: tenantId, periodo });
        }}
        disabled={pagar.isPending}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#2F6B2A] text-white hover:bg-[#255620] transition-colors disabled:opacity-60 min-h-10"
      >
        {pagar.isPending ? <IconLoader2 size={16} className="animate-spin" /> : <IconCreditCard size={16} />}
        Pagar {formatCLP(MONTO_PRUEBA_MP_NUCLEO_CLP)} (prueba)
      </button>
      {error && <p className="text-xs text-red-600 max-w-48 text-right">{error}</p>}
    </div>
  );
}
