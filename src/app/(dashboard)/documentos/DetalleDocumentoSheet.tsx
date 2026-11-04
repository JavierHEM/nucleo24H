"use client";

import { Dialogo } from "@/components/ui/Dialogo";
import { ConstanciaDeRecurso } from "@/components/declaraciones/ConstanciaDeRecurso";
import { ETIQUETA_EVIDENCIA, type EstadoEvidencia } from "@/lib/hallazgos/ciclo";
import { hrefArchivo } from "@/lib/storage/rutas";
import { formatDate, formatPeriodo } from "@/lib/utils";

type DocumentoDetalle = {
  id: string;
  nombre: string;
  categoria: string;
  mes: string;
  url: string;
  vencimiento: Date | string | null;
  estado: string;
  evidencia_estado: string;
  observacion: string | null;
};

export function DetalleDocumentoSheet({
  documento,
  onCerrar,
}: {
  documento: DocumentoDetalle | null;
  onCerrar: () => void;
}) {
  if (!documento) return null;

  return (
    <Dialogo abierto titulo={documento.nombre} onCerrar={onCerrar} ancho="lg">
      <div className="space-y-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-[#5B6980]">Categoría</dt>
            <dd className="font-medium text-[#0B1B33]">{documento.categoria}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5B6980]">Período</dt>
            <dd className="font-medium text-[#0B1B33]">{formatPeriodo(documento.mes)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5B6980]">Estado de evidencia</dt>
            <dd className="font-medium text-[#0B1B33]">
              {ETIQUETA_EVIDENCIA[documento.evidencia_estado as EstadoEvidencia] ?? documento.evidencia_estado}
            </dd>
          </div>
          {documento.vencimiento && (
            <div>
              <dt className="text-xs text-[#5B6980]">Vencimiento</dt>
              <dd className="font-medium text-[#0B1B33]">{formatDate(documento.vencimiento)}</dd>
            </div>
          )}
        </dl>
        {documento.observacion && (
          <p className="text-sm text-[#334155] bg-[#F4F6F3] rounded-xl px-4 py-3">{documento.observacion}</p>
        )}
        <a
          href={hrefArchivo(documento.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#16294A] underline"
        >
          Abrir archivo
        </a>
        <ConstanciaDeRecurso recursoTipo="documento" recursoId={documento.id} />
      </div>
    </Dialogo>
  );
}
