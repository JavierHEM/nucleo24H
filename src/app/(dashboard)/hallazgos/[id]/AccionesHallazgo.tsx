"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { CasillaDeclaracion } from "@/components/declaraciones/CasillaDeclaracion";
import {
  destinosPermitidos,
  ETIQUETA_ESTADO_HALLAZGO,
  ETIQUETA_EVIDENCIA,
  ESTADOS_EVIDENCIA,
  type EstadoEvidencia,
  type EstadoHallazgo,
} from "@/lib/hallazgos/ciclo";
import { esStaffNucleo } from "@/lib/comunicaciones/tickets";
import { ArchivosAdjuntos, type ArchivoSubido } from "@/components/ui/ArchivosAdjuntos";

export function AccionesHallazgo({
  id,
  estado,
  rol,
  tieneVisita,
  evidenciaEstado,
}: {
  id: string;
  estado: string;
  rol: string;
  tieneVisita: boolean;
  evidenciaEstado: string;
}) {
  const destinos = useMemo(() => destinosPermitidos(estado, rol), [estado, rol]);
  const [destino, setDestino] = useState<EstadoHallazgo | "">(destinos[0] ?? "");
  const [nota, setNota] = useState("");
  const [contencion, setContencion] = useState("");
  const [capa, setCapa] = useState("");
  const [evidencia, setEvidencia] = useState<ArchivoSubido[]>([]);
  const [aceptaC, setAceptaC] = useState(false);
  const [motivo, setMotivo] = useState("");
  const router = useRouter();
  const transicionar = trpc.hallazgos.transicionar.useMutation({
    onSuccess: () => router.refresh(),
  });
  const marcar = trpc.hallazgos.marcarEvidencia.useMutation({
    onSuccess: () => router.refresh(),
  });
  const staff = esStaffNucleo(rol);

  if (destinos.length === 0 && !staff) {
    return (
      <p className="text-sm text-[#5B6980]">
        Este hallazgo espera revisión del profesional de Núcleo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {destinos.length > 0 && (
        <form
          className="bg-white rounded-xl border border-[#DDE3EA] p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!destino) return;
            transicionar.mutate({
              id,
              destino,
              nota,
              contencion: contencion || undefined,
              accion_correctiva: capa || undefined,
              evidencia_cierre: evidencia.length > 0 ? evidencia.map((archivo) => archivo.ruta) : undefined,
              acepta_declaracion_c: destino === "evidencia_en_revision" ? aceptaC : undefined,
              motivo_decision: motivo || undefined,
            });
          }}
        >
          <label className="block text-sm">
            <span className="font-medium text-[#0B1B33]">Siguiente paso</span>
            <select
              value={destino}
              onChange={(e) => setDestino(e.target.value as EstadoHallazgo)}
              className="mt-1 w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3"
            >
              {destinos.map((s) => (
                <option key={s} value={s}>
                  {ETIQUETA_ESTADO_HALLAZGO[s]}
                </option>
              ))}
            </select>
          </label>
          {(destino === "medida_inmediata" || estado === "abierto") && (
            <textarea
              value={contencion}
              onChange={(e) => setContencion(e.target.value)}
              className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm"
              rows={3}
              placeholder="Medida inmediata / contención"
            />
          )}
          {(destino === "accion_informada" || destino === "evidencia_en_revision") && (
            <textarea
              value={capa}
              onChange={(e) => setCapa(e.target.value)}
              className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm"
              rows={3}
              placeholder="Acción correctiva ejecutada"
            />
          )}
          {destino === "evidencia_en_revision" && (
            <>
              <ArchivosAdjuntos
                bucket="hallazgos"
                valor={evidencia}
                onCambio={setEvidencia}
                maximo={8}
                etiqueta="Agregar evidencia"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
              />
              <CasillaDeclaracion tipo="C" checked={aceptaC} onChange={setAceptaC} />
            </>
          )}
          {staff && destino === "cerrado_validado" && (
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm"
              rows={2}
              placeholder="Motivo de la decisión de cierre"
            />
          )}
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm"
            rows={2}
            placeholder="Nota de bitácora"
          />
          {transicionar.error && <p className="text-sm text-red-600">{transicionar.error.message}</p>}
          <button
            type="submit"
            disabled={
              transicionar.isPending || !destino || (destino === "evidencia_en_revision" && !aceptaC)
            }
            className="min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-white text-sm disabled:opacity-60"
          >
            Actualizar estado
          </button>
        </form>
      )}

      {staff && (
        <form
          className="bg-white rounded-xl border border-[#DDE3EA] p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const value = (form.elements.namedItem("evidencia") as HTMLSelectElement).value as EstadoEvidencia;
            marcar.mutate({ id, evidencia_estado: value });
          }}
        >
          <p className="text-sm font-semibold text-[#0B1B33]">Estado de evidencia</p>
          <p className="text-xs text-[#5B6980]">
            Actual: {ETIQUETA_EVIDENCIA[evidenciaEstado as EstadoEvidencia] ?? evidenciaEstado}. No cambia al aceptar una declaración.
          </p>
          <select
            name="evidencia"
            defaultValue={evidenciaEstado}
            className="w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3"
          >
            {ESTADOS_EVIDENCIA.filter((e) => e !== "verificado_visita" || tieneVisita).map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_EVIDENCIA[e]}
              </option>
            ))}
          </select>
          {marcar.error && <p className="text-sm text-red-600">{marcar.error.message}</p>}
          <button type="submit" disabled={marcar.isPending} className="min-h-12 px-4 rounded-lg bg-[#0B1B33] text-white text-sm">
            Guardar estado de evidencia
          </button>
        </form>
      )}
    </div>
  );
}
