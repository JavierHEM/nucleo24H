"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

const ANCHO = {
  md: "max-w-md",
  xl: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export function Dialogo({
  abierto,
  titulo,
  onCerrar,
  children,
  pie,
  ancho = "md",
}: {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: keyof typeof ANCHO;
}) {
  const tituloId = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef(onCerrar);

  useEffect(() => {
    cerrarRef.current = onCerrar;
  });

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    contenedor.current?.focus();
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrarRef.current();
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      anterior?.focus();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCerrar}
    >
      <div
        ref={contenedor}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
        className={`bg-white rounded-t-2xl sm:rounded-2xl w-full shadow-xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col focus:outline-none ${ANCHO[ancho]}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA] shrink-0 bg-white rounded-t-2xl">
          <p id={tituloId} className="font-semibold text-[#0B1B33]">
            {titulo}
          </p>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-[#5B6980] hover:text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] rounded"
          >
            <IconX size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {pie ? (
          <div className="p-5 border-t border-[#DDE3EA] shrink-0 bg-white rounded-b-2xl">{pie}</div>
        ) : null}
      </div>
    </div>
  );
}
