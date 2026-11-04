"use client";

import { useState } from "react";
import { IconExternalLink, IconLoader2 } from "@tabler/icons-react";
import { cambiarLocalActivo } from "@/lib/locales/cambiarLocal";

interface Props {
  tenantId: string;
  destino?: string;
  etiqueta?: string;
}

export function VerLocalButton({ tenantId, destino = "/", etiqueta = "Ver" }: Props) {
  const [pendiente, setPendiente] = useState(false);

  async function handleClick() {
    setPendiente(true);
    try {
      await cambiarLocalActivo(tenantId, destino);
    } catch {
      setPendiente(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pendiente}
      title="Ver dashboard de este local"
      className="flex items-center gap-1 text-xs text-[#16294A] hover:text-[#2F6B2A] border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 hover:bg-[#E5F1E3] transition-colors disabled:opacity-50"
    >
      {pendiente ? (
        <IconLoader2 size={13} className="animate-spin" />
      ) : (
        <IconExternalLink size={13} />
      )}
      {etiqueta}
    </button>
  );
}
