"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconExternalLink, IconLoader2 } from "@tabler/icons-react";

interface Props {
  tenantId: string;
}

/**
 * Cambia el tenant_activo cookie al local indicado y navega al dashboard.
 * Permite a admin_nucleo supervisar cualquier local en contexto real.
 */
export function VerLocalButton({ tenantId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await fetch("/api/tenant/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Ver dashboard de este local"
      className="flex items-center gap-1 text-xs text-[#16294A] hover:text-[#2F6B2A] border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 hover:bg-[#E5F1E3] transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <IconLoader2 size={13} className="animate-spin" />
      ) : (
        <IconExternalLink size={13} />
      )}
      Ver
    </button>
  );
}
