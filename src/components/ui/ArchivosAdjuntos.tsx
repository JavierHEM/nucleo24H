"use client";

import { useRef, useState } from "react";
import { IconPaperclip, IconX } from "@tabler/icons-react";
import { subirArchivo } from "@/lib/storage/subirArchivo";
import type { BucketArchivo } from "@/lib/storage/rutas";

export type ArchivoSubido = { ruta: string; nombre: string };

export function ArchivosAdjuntos({
  bucket,
  valor,
  onCambio,
  maximo,
  etiqueta = "Adjuntar archivo",
}: {
  bucket: BucketArchivo;
  valor: ArchivoSubido[];
  onCambio: (archivos: ArchivoSubido[]) => void;
  maximo: number;
  etiqueta?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      {valor.length > 0 && (
        <ul className="space-y-1">
          {valor.map((archivo) => (
            <li key={archivo.ruta} className="flex items-center justify-between gap-2 rounded-lg bg-[#F4F6F3] px-3 py-2 text-sm">
              <span className="truncate text-[#0B1B33]">{archivo.nombre}</span>
              <button
                type="button"
                aria-label={`Quitar ${archivo.nombre}`}
                onClick={() => onCambio(valor.filter((otro) => otro.ruta !== archivo.ruta))}
                className="text-[#5B6980] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] rounded"
              >
                <IconX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {valor.length < maximo && (
        <>
          <input ref={entrada} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={alElegir} className="sr-only" tabIndex={-1} />
          <button
            type="button"
            disabled={subiendo}
            onClick={() => entrada.current?.click()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE3EA] px-3 text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] disabled:opacity-60"
          >
            <IconPaperclip size={16} />
            {subiendo ? "Subiendo…" : etiqueta}
          </button>
        </>
      )}
      {error && <p className="text-xs text-[#B42318]">{error}</p>}
    </div>
  );
}
