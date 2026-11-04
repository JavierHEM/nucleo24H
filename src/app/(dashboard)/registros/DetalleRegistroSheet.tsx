"use client";

import { Dialogo } from "@/components/ui/Dialogo";
import { ConstanciaDeRecurso } from "@/components/declaraciones/ConstanciaDeRecurso";
import { etiquetaPlanilla, resumenRegistro } from "@/lib/bpm/planillas";
import { ETIQUETA_EVIDENCIA, type EstadoEvidencia } from "@/lib/hallazgos/ciclo";
import { hrefArchivo } from "@/lib/storage/rutas";
import { formatDate } from "@/lib/utils";

type RegistroDetalle = {
  id: string;
  tipo: string;
  codigo: string | null;
  origen: string;
  fecha: Date | string;
  datos: unknown;
  estado: string;
  adjunto_url: string | null;
  evidencia_estado: string;
  extemporaneo: boolean;
};

export function DetalleRegistroSheet({
  registro,
  onCerrar,
}: {
  registro: RegistroDetalle | null;
  onCerrar: () => void;
}) {
  if (!registro) return null;

  const datos = (registro.datos ?? {}) as Record<string, unknown>;
  const titulo = etiquetaPlanilla(registro.codigo, registro.tipo);
  const esPapel = registro.origen === "papel";
  const detalle = esPapel ? "Planilla impresa" : resumenRegistro(registro.codigo, registro.tipo, datos);

  return (
    <Dialogo abierto titulo={titulo} onCerrar={onCerrar} ancho="lg">
      <div className="space-y-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-[#5B6980]">Fecha del control</dt>
            <dd className="font-medium text-[#0B1B33]">{formatDate(registro.fecha)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5B6980]">Origen</dt>
            <dd className="font-medium text-[#0B1B33]">{esPapel ? "Papel" : "Digital"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5B6980]">Estado de evidencia</dt>
            <dd className="font-medium text-[#0B1B33]">
              {ETIQUETA_EVIDENCIA[registro.evidencia_estado as EstadoEvidencia] ?? registro.evidencia_estado}
            </dd>
          </div>
          {registro.codigo && (
            <div>
              <dt className="text-xs text-[#5B6980]">Planilla</dt>
              <dd className="font-mono text-sm text-[#0B1B33]">{registro.codigo}</dd>
            </div>
          )}
        </dl>
        <p className="text-sm text-[#334155]">{detalle}</p>
        {registro.extemporaneo && (
          <p className="text-xs text-[#D97706] bg-amber-50 rounded-lg px-3 py-2">
            Registro extemporáneo: la fecha del control no coincide con el día de carga.
          </p>
        )}
        {esPapel && registro.adjunto_url && (
          <a
            href={hrefArchivo(registro.adjunto_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#16294A] underline"
          >
            Ver planilla adjunta
          </a>
        )}
        <ConstanciaDeRecurso recursoTipo="registro" recursoId={registro.id} />
      </div>
    </Dialogo>
  );
}
