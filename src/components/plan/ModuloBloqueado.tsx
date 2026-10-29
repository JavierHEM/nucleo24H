import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { PLANES, etiquetaPlan, type ModuloPlan } from "@/lib/planes";

export function ModuloBloqueado({
  modulo,
  titulo,
  planActual,
}: {
  modulo: ModuloPlan;
  titulo: string;
  planActual: unknown;
}) {
  const planConModulo = Object.values(PLANES).find((plan) => plan.modulos.includes(modulo));
  return (
    <div className="rounded-xl border border-dashed border-[#DDE3EA] bg-white p-8 text-center max-w-xl">
      <IconLock size={26} className="mx-auto text-[#5B6980]" aria-hidden />
      <p className="mt-3 font-bold text-[#0B1B33]">{titulo}</p>
      <p className="mt-1 text-sm text-[#5B6980]">
        Esta sección está incluida en el {planConModulo?.nombre ?? "plan superior"}. Tu local tiene el{" "}
        {etiquetaPlan(planActual)}.
      </p>
      <Link
        href="/comunicaciones"
        className="mt-4 inline-flex items-center min-h-10 px-4 rounded-lg border border-[#DDE3EA] text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        Consultar a tu asesor
      </Link>
    </div>
  );
}
