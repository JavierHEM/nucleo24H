"use client";

import { useState } from "react";
import { IconCreditCard, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { formatCLP } from "@/lib/utils";

interface PagarButtonProps {
  periodo: string;
  monto: number;
  disponible: boolean;
}

export function PagarButton({ periodo, monto, disponible }: PagarButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const pagar = trpc.pagos.pagar.useMutation({
    onSuccess: ({ redirectUrl }) => {
      window.location.href = redirectUrl;
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (!disponible) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed min-h-12"
        title="El pago en línea estará disponible próximamente"
      >
        <IconCreditCard size={18} />
        Pago en línea próximamente
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={() => {
          setError(null);
          pagar.mutate({ periodo });
        }}
        disabled={pagar.isPending}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#3D7A35] text-white hover:bg-[#2D5A27] transition-colors disabled:opacity-60 min-h-12"
      >
        {pagar.isPending ? (
          <IconLoader2 size={18} className="animate-spin" />
        ) : (
          <IconCreditCard size={18} />
        )}
        Pagar {formatCLP(monto)}
      </button>
      {error && <p className="text-xs text-red-600 max-w-60 text-right">{error}</p>}
    </div>
  );
}
