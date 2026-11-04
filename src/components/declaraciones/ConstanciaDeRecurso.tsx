"use client";

import { trpc } from "@/lib/trpc/client";
import type { RecursoConstancia } from "@/lib/declaraciones/constancia";
import { ConstanciaVeracidad } from "./ConstanciaVeracidad";

const VACIO: Record<RecursoConstancia, string> = {
  registro: "Este registro no tiene una declaración de veracidad. Los anteriores a la casilla A no la registraron.",
  documento:
    "Este documento no tiene una declaración de veracidad. Los anteriores a la casilla B no la registraron.",
  hallazgo: "Este hallazgo no tiene una declaración de veracidad registrada.",
  proveedor: "Este proveedor no tiene una declaración de veracidad por los archivos adjuntos.",
};

export function ConstanciaDeRecurso({
  recursoTipo,
  recursoId,
}: {
  recursoTipo: RecursoConstancia;
  recursoId: string;
}) {
  const consulta = trpc.declaraciones.deRecurso.useQuery({
    recurso_tipo: recursoTipo,
    recurso_id: recursoId,
  });

  if (consulta.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Cargando constancia">
        <div className="h-4 w-40 rounded bg-[#DDE3EA] animate-pulse" />
        <div className="h-24 rounded-xl bg-[#DDE3EA] animate-pulse" />
      </div>
    );
  }

  if (consulta.error) {
    return (
      <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-4 py-3">
        No se pudo cargar la constancia: {consulta.error.message}
      </p>
    );
  }

  return <ConstanciaVeracidad items={consulta.data ?? []} vacio={VACIO[recursoTipo]} />;
}
