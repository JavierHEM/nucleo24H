import { notFound } from "next/navigation";
import { getCaller } from "@/lib/trpc/server";
import {
  ETIQUETA_ESTADO_HALLAZGO,
  ETIQUETA_EVIDENCIA,
  ETIQUETA_GRAVEDAD,
  type EstadoEvidencia,
} from "@/lib/hallazgos/ciclo";
import { AccionesHallazgo } from "./AccionesHallazgo";
import { GaleriaArchivos } from "../GaleriaArchivos";
import { ConstanciaVeracidad } from "@/components/declaraciones/ConstanciaVeracidad";
import { AdjuntarDocumentosProveedor } from "../../proveedores/AdjuntarDocumentosProveedor";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function HallazgoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await getCaller();
  const hallazgo = await caller.hallazgos.get({ id }).catch(() => null);
  if (!hallazgo) notFound();

  return (
    <div className="space-y-6 w-full">
      <div>
        <p className="text-xs font-bold uppercase text-[#5B6980]">
          {ETIQUETA_GRAVEDAD[hallazgo.gravedad as keyof typeof ETIQUETA_GRAVEDAD] ?? hallazgo.gravedad}
        </p>
        <h1 className="text-2xl font-bold text-[#0B1B33] mt-1">{hallazgo.descripcion}</h1>
        <p className="text-sm text-[#5B6980] mt-2">
          {ETIQUETA_ESTADO_HALLAZGO[hallazgo.estado as keyof typeof ETIQUETA_ESTADO_HALLAZGO] ?? hallazgo.estado}
          {" · "}
          {ETIQUETA_EVIDENCIA[hallazgo.evidencia_estado as EstadoEvidencia] ?? hallazgo.evidencia_estado}
        </p>
      </div>
      {hallazgo.fundamento && <p className="text-sm text-[#334155]">{hallazgo.fundamento}</p>}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {hallazgo.plazo && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3">
            <dt className="text-xs text-[#5B6980]">Plazo</dt>
            <dd className="font-medium">{formatDate(hallazgo.plazo)}</dd>
          </div>
        )}
        {hallazgo.proveedor && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3">
            <dt className="text-xs text-[#5B6980]">Proveedor</dt>
            <dd className="font-medium">
              <Link href={`/proveedores/${hallazgo.proveedor.id}`} className="underline">
                {hallazgo.proveedor.razon_social}
              </Link>
            </dd>
          </div>
        )}
        {hallazgo.contencion && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3 sm:col-span-2">
            <dt className="text-xs text-[#5B6980]">Contención</dt>
            <dd>{hallazgo.contencion}</dd>
          </div>
        )}
        {hallazgo.accion_correctiva && (
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-3 sm:col-span-2">
            <dt className="text-xs text-[#5B6980]">Acción correctiva</dt>
            <dd>{hallazgo.accion_correctiva}</dd>
          </div>
        )}
      </dl>
      <GaleriaArchivos rutas={hallazgo.fotos_iniciales} titulo="Fotos iniciales" />
      <GaleriaArchivos rutas={hallazgo.evidencia_cierre} titulo="Evidencia de cierre" />
      {hallazgo.proveedor && (
        <section className="space-y-3">
          <GaleriaArchivos
            rutas={hallazgo.proveedor.documentos}
            titulo={`Autorización e informes de ${hallazgo.proveedor.razon_social}`}
          />
          {hallazgo.proveedor.documentos.length === 0 && (
            <p className="text-sm text-[#5B6980]">
              Este proveedor todavía no tiene autorización ni informe en su ficha.
            </p>
          )}
          <div className="bg-white rounded-xl border border-[#DDE3EA] p-4">
            <AdjuntarDocumentosProveedor
              proveedorId={hallazgo.proveedor.id}
              yaAdjuntos={hallazgo.proveedor.documentos.length}
            />
          </div>
        </section>
      )}
      <AccionesHallazgo
        id={hallazgo.id}
        estado={hallazgo.estado}
        rol={hallazgo.rol ?? ""}
        tieneVisita={Boolean(hallazgo.visita_id)}
        evidenciaEstado={hallazgo.evidencia_estado}
      />
      <div className="bg-white rounded-xl border border-[#DDE3EA] p-4">
        <ConstanciaVeracidad
          items={hallazgo.declaraciones}
          vacio="Este hallazgo no tiene una declaración de veracidad registrada."
        />
      </div>
      <div className="bg-white rounded-xl border border-[#DDE3EA] p-4 space-y-2">
        <p className="text-sm font-semibold">Bitácora</p>
        {hallazgo.eventos.map((e) => (
          <p key={e.id} className="text-xs text-[#5B6980]">
            {new Date(e.created_at).toLocaleString("es-CL")} · {e.de_estado ?? "—"} → {e.a_estado}
            {e.nota ? ` · ${e.nota}` : ""}
          </p>
        ))}
      </div>
    </div>
  );
}
