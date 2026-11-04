import { notFound } from "next/navigation";
import Link from "next/link";
import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import { ETIQUETA_ESTADO_HALLAZGO, ETIQUETA_GRAVEDAD } from "@/lib/hallazgos/ciclo";
import { GaleriaArchivos } from "@/app/(dashboard)/hallazgos/GaleriaArchivos";
import { ConstanciaDeRecurso } from "@/components/declaraciones/ConstanciaDeRecurso";
import { AdjuntarDocumentosProveedor } from "../AdjuntarDocumentosProveedor";
import { EliminarProveedorButton } from "../EliminarProveedorButton";

export default async function ProveedorFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await getCaller();
  const proveedor = await caller.proveedores.get({ id }).catch(() => null);
  if (!proveedor) notFound();

  const vencida = proveedor.vigencia ? proveedor.vigencia < new Date() : false;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link href="/proveedores" className="text-xs text-[#16294A] underline">
            Volver a proveedores
          </Link>
          <h1 className="text-2xl font-bold text-[#0B1B33] mt-2">{proveedor.razon_social}</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            RUT {proveedor.rut} · {proveedor.tipo_servicio}
          </p>
        </div>
        <EliminarProveedorButton id={proveedor.id} />
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {proveedor.contacto && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3">
            <dt className="text-xs text-[#5B6980]">Contacto</dt>
            <dd className="font-medium">{proveedor.contacto}</dd>
          </div>
        )}
        {proveedor.autorizacion_entidad && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3">
            <dt className="text-xs text-[#5B6980]">Autorización</dt>
            <dd className="font-medium">
              {proveedor.autorizacion_entidad}
              {proveedor.autorizacion_numero ? ` · ${proveedor.autorizacion_numero}` : ""}
            </dd>
          </div>
        )}
        {proveedor.vigencia && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3">
            <dt className="text-xs text-[#5B6980]">Vigencia</dt>
            <dd className={`font-medium ${vencida ? "text-[#B42318]" : ""}`}>
              {formatDate(proveedor.vigencia)}
              {vencida ? " · vencida" : ""}
            </dd>
          </div>
        )}
        {proveedor.alcance && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3 sm:col-span-2">
            <dt className="text-xs text-[#5B6980]">Alcance</dt>
            <dd>{proveedor.alcance}</dd>
          </div>
        )}
      </dl>

      <GaleriaArchivos rutas={proveedor.documentos} titulo="Autorización e informes" />
      {proveedor.documentos.length === 0 && (
        <p className="text-sm text-[#5B6980]">Todavía no hay autorización ni informe en esta ficha.</p>
      )}
      <div className="bg-white rounded-xl border border-[#DDE3EA] p-4">
        <AdjuntarDocumentosProveedor proveedorId={proveedor.id} yaAdjuntos={proveedor.documentos.length} />
      </div>

      <section className="bg-white rounded-xl border border-[#DDE3EA] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#0B1B33]">Hallazgos vinculados</h2>
        {proveedor.hallazgos.length === 0 ? (
          <p className="text-sm text-[#5B6980]">
            Ningún hallazgo apunta a este proveedor. Al registrar un hallazgo puedes asociarlo desde el formulario.
          </p>
        ) : (
          <ul className="divide-y divide-[#DDE3EA]">
            {proveedor.hallazgos.map((hallazgo) => (
              <li key={hallazgo.id}>
                <Link href={`/hallazgos/${hallazgo.id}`} className="block py-3 hover:bg-[#F4F6F3] rounded-lg px-1">
                  <p className="text-sm font-medium text-[#0B1B33]">{hallazgo.descripcion}</p>
                  <p className="text-xs text-[#5B6980] mt-0.5">
                    {ETIQUETA_GRAVEDAD[hallazgo.gravedad as keyof typeof ETIQUETA_GRAVEDAD] ?? hallazgo.gravedad}
                    {" · "}
                    {ETIQUETA_ESTADO_HALLAZGO[hallazgo.estado as keyof typeof ETIQUETA_ESTADO_HALLAZGO] ??
                      hallazgo.estado}
                    {" · "}
                    {formatDate(hallazgo.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="bg-white rounded-xl border border-[#DDE3EA] p-4">
        <ConstanciaDeRecurso recursoTipo="proveedor" recursoId={proveedor.id} />
      </div>
    </div>
  );
}
