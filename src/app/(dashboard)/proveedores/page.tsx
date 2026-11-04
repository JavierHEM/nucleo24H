import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import { CrearProveedorButton } from "./CrearProveedorButton";
import { EliminarProveedorButton } from "./EliminarProveedorButton";
import Link from "next/link";

export default async function ProveedoresPage() {
  const caller = await getCaller();
  const proveedores = await caller.proveedores.list().catch(() => []);
  const hoy = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Proveedores</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Ficha, autorización, informes y hallazgos vinculados.
          </p>
        </div>
        <CrearProveedorButton />
      </div>
      <div className="bg-white rounded-xl border border-[#DDE3EA] divide-y">
        {proveedores.length === 0 ? (
          <p className="p-8 text-sm text-[#5B6980] text-center">No hay proveedores registrados.</p>
        ) : (
          proveedores.map((p) => {
            const vencida = p.vigencia ? p.vigencia < hoy : false;
            const archivos = p.documentos.length;
            const hallazgos = p._count.hallazgos;
            return (
              <div key={p.id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/proveedores/${p.id}`} className="font-medium text-[#0B1B33] hover:underline">
                    {p.razon_social}
                  </Link>
                  <p className="text-xs text-[#5B6980] mt-1">
                    RUT {p.rut} · {p.tipo_servicio}
                    {p.vigencia ? ` · Vigencia ${formatDate(p.vigencia)}` : ""}
                    {vencida ? " · vencida" : ""}
                  </p>
                  {p.autorizacion_entidad && (
                    <p className="text-xs text-[#5B6980]">
                      Autorización: {p.autorizacion_entidad}
                      {p.autorizacion_numero ? ` ${p.autorizacion_numero}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-[#5B6980] mt-1">
                    {archivos === 0 ? "Sin archivos" : `${archivos} archivo${archivos === 1 ? "" : "s"}`}
                    {" · "}
                    {hallazgos === 0
                      ? "sin hallazgos"
                      : `${hallazgos} hallazgo${hallazgos === 1 ? "" : "s"}`}
                  </p>
                  <Link href={`/proveedores/${p.id}`} className="text-xs text-[#2F6B2A] underline mt-1 inline-block">
                    Abrir ficha
                  </Link>
                </div>
                <EliminarProveedorButton id={p.id} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
