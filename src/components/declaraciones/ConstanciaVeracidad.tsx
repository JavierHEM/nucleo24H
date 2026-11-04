import {
  etiquetaEventoDeclaracion,
  etiquetaTipoDeclaracion,
  type ConstanciaConsultable,
} from "@/lib/declaraciones/constancia";

function formatFechaHora(date: Date | string) {
  return new Date(date).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  });
}

export function ConstanciaVeracidad({
  items,
  vacio = "Este ítem no tiene una declaración de veracidad registrada.",
}: {
  items: ConstanciaConsultable[];
  vacio?: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[#0B1B33]">Constancia de veracidad</p>
        <p className="text-xs text-[#5B6980] mt-0.5">
          Texto aceptado al momento de firmar. No equivale a una verificación de Núcleo 24H.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#5B6980] bg-[#F4F6F3] rounded-xl px-4 py-3">{vacio}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[#DDE3EA] bg-white p-4 space-y-2">
              <p className="text-sm font-semibold text-[#0B1B33]">{etiquetaTipoDeclaracion(item.tipo)}</p>
              <p className="text-xs text-[#5B6980]">
                {item.firmante} · {formatFechaHora(item.created_at)} · v{item.version} ·{" "}
                {etiquetaEventoDeclaracion(item.evento)}
              </p>
              <p className="text-sm text-[#334155] leading-relaxed">{item.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
