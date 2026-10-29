import { IconCheck, IconCircleDashed, IconDownload } from "@tabler/icons-react";
import { formatPeriodo } from "@/lib/utils";

type Item = { texto: string; hecho: boolean; detalle: string };

export function ResumenDelMes({
  periodo,
  tenantId,
  items,
  hayInforme,
}: {
  periodo: string;
  tenantId: string;
  items: Item[];
  hayInforme: boolean;
}) {
  return (
    <section className="rounded-[14px] border border-[#DDE3EA] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-[#5B6980] capitalize">Resumen de {formatPeriodo(periodo)}</p>
        {hayInforme && (
          <a
            href={`/api/pdf/sello?tenantId=${tenantId}&periodo=${periodo}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE3EA] px-3 min-h-9 text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
          >
            <IconDownload size={14} aria-hidden />
            Descargar informe
          </a>
        )}
      </div>
      <ul className="mt-2">
        {items.map((item) => (
          <li key={item.texto} className="flex items-start gap-3 py-2 border-b border-[#F1F5F9] last:border-0">
            {item.hecho ? (
              <IconCheck size={16} className="mt-0.5 text-[#2F6B2A] shrink-0" aria-hidden />
            ) : (
              <IconCircleDashed size={16} className="mt-0.5 text-[#5B6980] shrink-0" aria-hidden />
            )}
            <div>
              <p className="text-sm font-medium text-[#0B1B33]">{item.texto}</p>
              <p className="text-xs text-[#5B6980]">{item.detalle}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
