import Link from "next/link";
import { AVISO_EVIDENCIA_TERCEROS } from "@/lib/declaraciones/textos";

export function AvisoEvidenciaTerceros() {
  return (
    <aside
      role="note"
      className="rounded-xl border border-[#DDE3EA] bg-[#F4F6F3] px-3 py-2.5 text-xs text-[#334155] leading-relaxed"
    >
      <p className="font-semibold text-[#0B1B33] mb-0.5">{AVISO_EVIDENCIA_TERCEROS.titulo}</p>
      <p>
        {AVISO_EVIDENCIA_TERCEROS.texto}{" "}
        <Link
          href="/politica-de-privacidad"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 text-[#16294A] hover:text-[#2F6B2A]"
        >
          Política de privacidad
        </Link>
        .
      </p>
    </aside>
  );
}
