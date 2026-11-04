"use client";

import { useRef, useState } from "react";
import { IconCamera, IconPaperclip, IconX } from "@tabler/icons-react";
import { subirArchivo } from "@/lib/storage/subirArchivo";
import { esImagenRuta, hrefArchivo, type BucketArchivo } from "@/lib/storage/rutas";
import { AvisoEvidenciaTerceros } from "@/components/declaraciones/AvisoEvidenciaTerceros";

export type ArchivoSubido = { ruta: string; nombre: string };

export function ArchivosAdjuntos({
  bucket,
  valor,
  onCambio,
  maximo,
  etiqueta = "Adjuntar archivo",
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  variante = "lista",
}: {
  bucket: BucketArchivo;
  valor: ArchivoSubido[];
  onCambio: (archivos: ArchivoSubido[]) => void;
  maximo: number;
  etiqueta?: string;
  accept?: string;
  variante?: "lista" | "fotos";
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esFotos = variante === "fotos";

  async function alElegir(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const ruta = await subirArchivo(archivo, bucket);
      onCambio([...valor, { ruta, nombre: archivo.name }]);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-2">
      {valor.length > 0 && esFotos && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {valor.map((archivo, indice) => (
            <li key={archivo.ruta} className="relative aspect-square rounded-xl overflow-hidden border border-[#DDE3EA] bg-[#F4F6F3]">
              {esImagenRuta(archivo.ruta) ? (
                <img src={hrefArchivo(archivo.ruta)} alt={archivo.nombre} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center p-2 text-[11px] font-medium text-[#16294A]">{archivo.nombre}</span>
              )}
              <button
                type="button"
                aria-label={`Quitar foto ${indice + 1}`}
                onClick={() => onCambio(valor.filter((otro) => otro.ruta !== archivo.ruta))}
                className="absolute top-1 right-1 w-8 h-8 rounded-full bg-white/95 text-[#0B1B33] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
              >
                <IconX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {valor.length > 0 && !esFotos && (
        <ul className="space-y-1">
          {valor.map((archivo) => (
            <li key={archivo.ruta} className="flex items-center justify-between gap-2 rounded-lg bg-[#F4F6F3] px-3 py-2 text-sm">
              <span className="truncate text-[#0B1B33]">{archivo.nombre}</span>
              <button
                type="button"
                aria-label={`Quitar ${archivo.nombre}`}
                onClick={() => onCambio(valor.filter((otro) => otro.ruta !== archivo.ruta))}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#5B6980] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] rounded"
              >
                <IconX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {valor.length < maximo && (
        <>
          <AvisoEvidenciaTerceros />
          <input ref={entrada} type="file" accept={accept} onChange={alElegir} className="sr-only" tabIndex={-1} />
          <button
            type="button"
            disabled={subiendo}
            onClick={() => entrada.current?.click()}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#DDE3EA] px-4 text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] disabled:opacity-60 ${esFotos ? "w-full" : ""}`}
          >
            {esFotos ? <IconCamera size={18} /> : <IconPaperclip size={16} />}
            {subiendo ? "Subiendo…" : etiqueta}
          </button>
        </>
      )}
      {error && <p className="text-xs text-[#B42318]">{error}</p>}
    </div>
  );
}
