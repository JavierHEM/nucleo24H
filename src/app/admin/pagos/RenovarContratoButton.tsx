"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function RenovarContratoButton({ tenantId, tenantNombre }: { tenantId: string; tenantNombre: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const renovar = trpc.pagos.renovarContrato.useMutation({
    onSuccess: async () => {
      await utils.pagos.adminResumen.invalidate();
      router.refresh();
    },
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={renovar.isPending}
        onClick={() => {
          if (window.confirm(`¿Renovar por 12 meses el contrato de ${tenantNombre}?`)) {
            renovar.mutate({ tenant_id: tenantId });
          }
        }}
      >
        {renovar.isPending ? "Renovando…" : "Renovar 12 meses"}
      </Button>
      {renovar.error && <p className="text-xs text-[#B42318] max-w-48 text-right">{renovar.error.message}</p>}
    </div>
  );
}
