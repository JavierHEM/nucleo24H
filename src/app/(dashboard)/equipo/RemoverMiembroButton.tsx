"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";

interface Props {
  userId: string;
  nombre: string;
}

export function RemoverMiembroButton({ userId, nombre }: Props) {
  const [confirmar, setConfirmar] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();

  const remover = trpc.locales.removerMiembro.useMutation({
    onSuccess: () => {
      utils.locales.miEquipo.invalidate();
      setConfirmar(false);
      router.refresh();
    },
  });

  if (!confirmar) {
    return (
      <button
        onClick={() => setConfirmar(true)}
        className="text-[#DC2626] hover:text-red-800 transition-colors p-1 rounded"
        title="Remover del local"
      >
        <IconTrash size={15} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#64748B]">¿Remover a {nombre.split(" ")[0]}?</span>
      <button
        onClick={() => remover.mutate({ user_id: userId })}
        disabled={remover.isPending}
        className="text-xs font-semibold text-[#DC2626] hover:underline"
      >
        {remover.isPending ? <IconLoader2 size={12} className="animate-spin" /> : "Sí"}
      </button>
      <button
        onClick={() => setConfirmar(false)}
        className="text-xs text-[#64748B] hover:underline"
      >
        No
      </button>
    </div>
  );
}
