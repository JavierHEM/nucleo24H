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
      className="w-full text-center text-xs font-medium text-[#3D7A35] border border-[#3D7A35] rounded-lg py-2 hover:bg-[#EAF3E0] transition-colors disabled:opacity-50"
    >
      {isPending ? "Cambiando..." : "Ir a este local →"}
    </button>
  );
}
