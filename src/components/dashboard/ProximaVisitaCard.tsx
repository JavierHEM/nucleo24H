import Link from "next/link";
import { IconCalendarEvent } from "@tabler/icons-react";
import { diasParaFecha } from "@/lib/planes";
import { formatDate } from "@/lib/utils";

export function ProximaVisitaCard({ proxima, ultima }: { proxima: Date | null; ultima: Date | null }) {
  const dias = proxima ? diasParaFecha(proxima) : null;
  return (
    <section className="rounded-[14px] border border-[#DDE3EA] bg-white p-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#5B6980]">
        <IconCalendarEvent size={16} aria-hidden />
        Próxima visita
      </div>
      {proxima ? (
        <>
          <p className="mt-2 font-mono text-3xl font-semibold leading-none text-[#0B1B33]">{formatDate(proxima)}</p>
          <p className="mt-1.5 text-sm font-semibold text-[#5B6980]">
            {dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : `En ${dias} días`}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-[#5B6980]">
          Tu asesor aún no agenda la próxima visita.
          {ultima ? ` La última fue el ${formatDate(ultima)}.` : ""}
        </p>
      )}
      <Link href="/calendario" className="mt-3 inline-block text-sm font-medium text-[#255620] underline">
        Ver calendario
      </Link>
    </section>
  );
}
