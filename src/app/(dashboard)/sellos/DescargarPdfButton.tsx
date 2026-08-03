"use client";

import { useState } from "react";
import { IconFileTypePdf, IconLoader2, IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface Props {
  tenantId: string;
  periodo: string;
}

export function DescargarPdfButton({ tenantId, periodo }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/pdf/sello?tenantId=${tenantId}&periodo=${periodo}`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error ?? "Error al generar PDF");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sello-${periodo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al descargar el PDF. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="gap-2 border-[#E2E8F0] text-[#334155] hover:bg-[#F8F9FA]"
    >
      {loading ? (
        <IconLoader2 size={15} className="animate-spin" />
      ) : (
        <IconFileTypePdf size={15} className="text-red-500" />
      )}
      {loading ? "Generando..." : "Descargar PDF"}
      {!loading && <IconDownload size={13} className="text-[#94A3B8]" />}
    </Button>
  );
}
