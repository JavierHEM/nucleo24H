"use client";

import Link from "next/link";

export function DescargarInformeButton({ periodo }: { periodo: string }) {
  return (
    <Link
      href={`/sellos/informe?periodo=${periodo}`}
      className="text-xs text-[#5B6980] hover:text-[#0B1B33] border border-[#DDE3EA] rounded-lg px-3 py-1.5 hover:bg-[#F4F6F3]"
    >
      Informe mensual
    </Link>
  );
}
