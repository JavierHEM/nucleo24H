"use client";

import Link from "next/link";
import { IconPrinter } from "@tabler/icons-react";

export function ImprimirButton() {
  return (
    <div className="print:hidden flex items-center justify-between gap-3 mb-6">
      <Link href="/" className="text-sm font-medium text-[#16294A] underline">
        Volver
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 min-h-10 px-4 rounded-lg bg-[#16294A] text-white text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        <IconPrinter size={16} />
        Imprimir o guardar PDF
      </button>
    </div>
  );
}
