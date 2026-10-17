"use client";

import { useState } from "react";
import { IconLoader2, IconMailForward } from "@tabler/icons-react";

export function ReenviarAccesoButton({ tenantId }: { tenantId: string }) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "listo" | "error">("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function reenviar() {
    setEstado("enviando");
    setMensaje(null);
    const res = await fetch("/api/admin/reenviar-acceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!res.ok) {
      setEstado("error");
      setMensaje(json.error ?? "No se pudo reenviar.");
      return;
    }
    setEstado("listo");
    setMensaje(json.message ?? "Acceso reenviado.");
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={reenviar}
        disabled={estado === "enviando"}
        title="Reenviar el enlace para que el dueño cree su clave"
        className="flex items-center gap-1 text-xs text-[#16294A] hover:text-[#2F6B2A] border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 hover:bg-[#E5F1E3] transition-colors disabled:opacity-50"
      >
        {estado === "enviando" ? (
          <IconLoader2 size={13} className="animate-spin" />
        ) : (
          <IconMailForward size={13} />
        )}
        Reenviar acceso
      </button>
      {mensaje && (
        <span className={`max-w-48 text-right text-[11px] ${estado === "error" ? "text-[#B42318]" : "text-[#255620]"}`}>
          {mensaje}
        </span>
      )}
    </span>
  );
}
