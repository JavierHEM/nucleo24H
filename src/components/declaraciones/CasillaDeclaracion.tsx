"use client";

import { DECLARACIONES, type TipoDeclaracion } from "@/lib/declaraciones/textos";

export function CasillaDeclaracion({
  tipo,
  checked,
  onChange,
}: {
  tipo: TipoDeclaracion;
  checked: boolean;
  onChange: (valor: boolean) => void;
}) {
  const decl = DECLARACIONES[tipo];
  return (
    <label className="flex items-start gap-3 rounded-xl border border-[#DDE3EA] p-3 text-sm text-[#334155]">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[#2F6B2A]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block font-semibold text-[#0B1B33] mb-1">{decl.titulo}</span>
        {decl.texto}
      </span>
    </label>
  );
}
