"use client";

import { useState } from "react";
import { cambiarLocalActivo } from "@/lib/locales/cambiarLocal";

interface Props {
  tenantId: string;
}

export function SwitchLocalButton({ tenantId }: Props) {
  const [pendiente, setPendiente] = useState(false);

  async function handleSwitch() {
    setPendiente(true);
    try {
      await cambiarLocalActivo(tenantId, "/");
    } catch {
      setPendiente(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSwitch()}
      disabled={pendiente}
      className="w-full text-center text-xs font-medium text-[#2F6B2A] border border-[#2F6B2A] rounded-lg py-2 hover:bg-[#E5F1E3] transition-colors disabled:opacity-50"
    >
      {pendiente ? "Cambiando..." : "Ir a este local →"}
    </button>
  );
}
