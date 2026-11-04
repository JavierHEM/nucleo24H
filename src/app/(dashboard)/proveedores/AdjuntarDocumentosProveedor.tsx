"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { ArchivosAdjuntos, type ArchivoSubido } from "@/components/ui/ArchivosAdjuntos";
import { CasillaDeclaracion } from "@/components/declaraciones/CasillaDeclaracion";

export function AdjuntarDocumentosProveedor({
  proveedorId,
  yaAdjuntos = 0,
}: {
  proveedorId: string;
  yaAdjuntos?: number;
}) {
  const cupo = Math.max(0, 8 - yaAdjuntos);
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [aceptaB, setAceptaB] = useState(false);
  const router = useRouter();
  const adjuntar = trpc.proveedores.adjuntar.useMutation({
    onSuccess: () => {
      setArchivos([]);
      setAceptaB(false);
      router.refresh();
    },
  });

  if (cupo === 0) return null;

  return (
    <form
      className="space-y-3"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!aceptaB || archivos.length === 0) return;
        adjuntar.mutate({
          id: proveedorId,
          documentos: archivos.map((archivo) => archivo.ruta),
          acepta_declaracion_b: true,
        });
      }}
    >
      <p className="text-sm font-medium text-[#0B1B33]">Subir autorización o informe</p>
      <ArchivosAdjuntos
        bucket="documentos"
        valor={archivos}
        onCambio={setArchivos}
        maximo={cupo}
        etiqueta="Adjuntar PDF o imagen"
      />
      {archivos.length > 0 && <CasillaDeclaracion tipo="B" checked={aceptaB} onChange={setAceptaB} />}
      {adjuntar.error && <p className="text-sm text-[#B42318]">{adjuntar.error.message}</p>}
      {archivos.length > 0 && (
        <button
          type="submit"
          disabled={!aceptaB || adjuntar.isPending}
          className="min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-white text-sm font-medium disabled:opacity-50"
        >
          {adjuntar.isPending ? "Guardando..." : "Guardar en la ficha"}
        </button>
      )}
    </form>
  );
}
