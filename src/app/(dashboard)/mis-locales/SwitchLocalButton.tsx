"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  tenantId: string;
}

export function SwitchLocalButton({ tenantId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSwitch() {
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
      onClick={handleSwitch}
      disabled={isPending}
      className="w-full text-center text-xs font-medium text-[#4B8B2E] border border-[#4B8B2E] rounded-lg py-2 hover:bg-[#EBF5E6] transition-colors disabled:opacity-50"
    >
      {isPending ? "Cambiando..." : "Ir a este local →"}
    </button>
  );
}
