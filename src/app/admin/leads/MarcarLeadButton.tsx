"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

export function MarcarLeadButton({ id, atendido }: { id: string; atendido: boolean }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const marcar = trpc.leads.marcarAtendido.useMutation({
    onSuccess: () => {
      void utils.leads.list.invalidate();
      router.refresh();
    },
  });

  return (
    <button
      type="button"
      disabled={marcar.isPending}
      onClick={() => marcar.mutate({ id, atendido: !atendido })}
      className="text-sm font-semibold text-[#2F6B2A] hover:underline disabled:opacity-50 min-h-10 px-2"
    >
      {marcar.isPending ? "Guardando…" : atendido ? "Reabrir" : "Marcar atendida"}
    </button>
  );
}
