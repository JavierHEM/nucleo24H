import { getCaller } from "@/lib/trpc/server";
import Link from "next/link";
import { ESTADOS_HALLAZGO, ETIQUETA_ESTADO_HALLAZGO, ETIQUETA_GRAVEDAD, GRAVEDADES } from "@/lib/hallazgos/ciclo";
import { CrearHallazgoButton } from "./CrearHallazgoButton";
import { formatDate } from "@/lib/utils";

export default async function HallazgosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; gravedad?: string }>;
}) {
  const filtros = await searchParams;
  const caller = await getCaller();
  const hallazgos = await caller.hallazgos
    .list({
      limit: 80,
      estado: filtros.estado,
      gravedad: filtros.gravedad,
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Hallazgos</h1>
          <p className="text-sm text-[#5B6980] mt-1">Ciclo de no conformidades, evidencias y cierre validado.</p>
        </div>
        <CrearHallazgoButton />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/hallazgos" className="text-xs border border-[#DDE3EA] rounded-full px-3 py-1.5">
          Todos
        </Link>
        {ESTADOS_HALLAZGO.map((estado) => (
          <Link
            key={estado}
            href={`/hallazgos?estado=${estado}`}
            className={`text-xs border rounded-full px-3 py-1.5 ${filtros.estado === estado ? "border-[#2F6B2A] bg-[#E5F1E3]" : "border-[#DDE3EA]"}`}
          >
            {ETIQUETA_ESTADO_HALLAZGO[estado]}
          </Link>
        ))}
        {GRAVEDADES.map((g) => (
          <Link
            key={g}
            href={`/hallazgos?gravedad=${g}`}
            className={`text-xs border rounded-full px-3 py-1.5 ${filtros.gravedad === g ? "border-[#2F6B2A] bg-[#E5F1E3]" : "border-[#DDE3EA]"}`}
          >
            {ETIQUETA_GRAVEDAD[g]}
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#DDE3EA] divide-y">
        {hallazgos.length === 0 ? (
          <p className="p-8 text-sm text-[#5B6980] text-center">No hay hallazgos registrados.</p>
        ) : (
          hallazgos.map((h) => (
            <Link key={h.id} href={`/hallazgos/${h.id}`} className="flex items-center justify-between p-4 hover:bg-[#F4F6F3]">
              <div>
                <p className="font-medium text-[#0B1B33]">{h.descripcion}</p>
                <p className="text-xs text-[#5B6980] mt-1">
                  {ETIQUETA_GRAVEDAD[h.gravedad as keyof typeof ETIQUETA_GRAVEDAD] ?? h.gravedad} ·{" "}
                  {ETIQUETA_ESTADO_HALLAZGO[h.estado as keyof typeof ETIQUETA_ESTADO_HALLAZGO] ?? h.estado}
                  {h.proveedor ? ` · ${h.proveedor.razon_social}` : ""}
                  {h.plazo ? ` · plazo ${formatDate(h.plazo)}` : ""}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
