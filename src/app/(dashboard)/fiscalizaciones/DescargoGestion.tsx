"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ESTADOS_DESCARGO,
  ESTADO_DESCARGO_LABEL,
  esEstadoDescargo,
  transicionDescargoValida,
  type EstadoDescargo,
} from "@/lib/descargos";

export function DescargoGestion({ id, estado, respuesta }: { id: string; estado: string; respuesta: string | null }) {
  const actual: EstadoDescargo = esEstadoDescargo(estado) ? estado : "abierto";
  const [siguiente, setSiguiente] = useState<EstadoDescargo>(actual);
  const [texto, setTexto] = useState(respuesta ?? "");
  const utils = trpc.useUtils();

  const actualizar = trpc.fiscalizaciones.actualizarDescargo.useMutation({
    onSuccess: () => utils.fiscalizaciones.resumen.invalidate(),
  });

  if (actual === "cerrado") return null;

  const opciones = ESTADOS_DESCARGO.filter((valor) => valor === actual || transicionDescargoValida(actual, valor));

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        actualizar.mutate({ id, estado: siguiente, respuesta: texto || undefined });
      }}
      className="mt-3 space-y-3 rounded-lg bg-[#F4F6F3] p-3"
    >
      <div>
        <Label htmlFor={`estado-${id}`}>Estado</Label>
        <select
          id={`estado-${id}`}
          value={siguiente}
          onChange={(evento) => setSiguiente(evento.target.value as EstadoDescargo)}
          className="mt-1 flex min-h-11 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
        >
          {opciones.map((valor) => (
            <option key={valor} value={valor}>
              {ESTADO_DESCARGO_LABEL[valor]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`respuesta-${id}`}>Respuesta para el local</Label>
        <textarea
          id={`respuesta-${id}`}
          rows={3}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          className="mt-1 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
        />
      </div>
      {actualizar.error && <p className="text-sm text-[#B42318]">{actualizar.error.message}</p>}
      <Button type="submit" size="sm" disabled={actualizar.isPending} className="bg-[#2F6B2A] hover:bg-[#255620] text-white">
        {actualizar.isPending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
