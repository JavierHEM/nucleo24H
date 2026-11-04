import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { LEYENDA_ALCANCE_SELLO } from "@/lib/declaraciones/textos";
import { ETIQUETA_ESTADO_HALLAZGO, ETIQUETA_GRAVEDAD } from "@/lib/hallazgos/ciclo";
import { ETIQUETA_NIVEL_V2, type NivelSelloV2 } from "@/lib/sellos/v2";
import { getCurrentPeriodo } from "@/lib/utils";

export default async function InformeMensualPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; tenant_id?: string }>;
}) {
  const { periodo: periodoParam, tenant_id: tenantParam } = await searchParams;
  const periodo = periodoParam && /^\d{4}-\d{2}$/.test(periodoParam) ? periodoParam : getCurrentPeriodo();
  const cookieStore = await cookies();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dbUser = user
    ? await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } })
    : null;
  const staff = dbUser?.rol === "asesor" || dbUser?.rol === "admin_nucleo";
  if (staff && tenantParam && dbUser?.rol === "asesor" && user) {
    const asignado = await prisma.asignacionAsesor.findFirst({
      where: { asesor_id: user.id, tenant_id: tenantParam, activo: true },
      select: { id: true },
    });
    if (!asignado) notFound();
  }
  const tenantId = (staff && tenantParam) || cookieStore.get("tenant_activo")?.value;
  if (!tenantId) notFound();

  const [year, month] = periodo.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fin = new Date(year, month, 0, 23, 59, 59, 999);

  const [tenant, sello, hallazgos, registros, documentos] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombre: true, ciudad: true } }),
    prisma.sello.findUnique({ where: { tenant_id_periodo: { tenant_id: tenantId, periodo } } }),
    prisma.hallazgo.findMany({
      where: { tenant_id: tenantId, created_at: { gte: inicio, lte: fin } },
      orderBy: { created_at: "desc" },
    }),
    prisma.registro.findMany({
      where: { tenant_id: tenantId, fecha: { gte: inicio, lte: fin } },
      select: { evidencia_estado: true, extemporaneo: true },
    }),
    prisma.documento.findMany({
      where: { tenant_id: tenantId, mes: periodo },
      select: { evidencia_estado: true },
    }),
  ]);
  if (!tenant) notFound();

  const evidencias = [...registros.map((r) => r.evidencia_estado), ...documentos.map((d) => d.evidencia_estado)];
  const conteo = (estado: string) => evidencias.filter((e) => e === estado).length;

  return (
    <article className="max-w-3xl mx-auto bg-white border border-[#DDE3EA] rounded-2xl p-8 space-y-6 print:border-0">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-[#5B6980]">Informe mensual</p>
        <h1 className="text-2xl font-extrabold text-[#0B1B33] mt-1">{tenant.nombre}</h1>
        <p className="text-sm text-[#5B6980]">
          {tenant.ciudad} · {periodo}
        </p>
      </header>
      {sello ? (
        <section>
          <p className="text-4xl font-extrabold">{Math.round(sello.score_general)}</p>
          <p className="font-semibold">
            {sello.esquema === "v2"
              ? ETIQUETA_NIVEL_V2[sello.nivel as NivelSelloV2] ?? sello.nivel
              : sello.nivel}
          </p>
          {sello.esquema === "v2" && (
            <p className="text-sm text-[#5B6980] mt-1">
              Seguimiento {sello.score_seguimiento} / 60 · Visita {sello.score_visita} / 40
            </p>
          )}
        </section>
      ) : (
        <p className="text-sm text-[#5B6980]">Aún no hay sello emitido para este período.</p>
      )}
      <section>
        <h2 className="text-sm font-bold uppercase text-[#5B6980]">Evidencias</h2>
        <p className="text-sm mt-1">
          Declarado por el cliente: {conteo("declarado_cliente")} · Revisado documental: {conteo("revisado_documental")} ·
          Verificado en visita: {conteo("verificado_visita")}
        </p>
        <p className="text-xs text-[#5B6980] mt-1">
          Extemporáneos: {registros.filter((r) => r.extemporaneo).length}
        </p>
      </section>
      <section>
        <h2 className="text-sm font-bold uppercase text-[#5B6980]">Hallazgos del período</h2>
        {hallazgos.length === 0 ? (
          <p className="text-sm mt-1">Sin hallazgos en el mes.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {hallazgos.map((h) => (
              <li key={h.id} className="text-sm">
                <span className="font-semibold">
                  {ETIQUETA_GRAVEDAD[h.gravedad as keyof typeof ETIQUETA_GRAVEDAD] ?? h.gravedad}
                </span>
                {" · "}
                {ETIQUETA_ESTADO_HALLAZGO[h.estado as keyof typeof ETIQUETA_ESTADO_HALLAZGO] ?? h.estado}
                {" — "}
                {h.descripcion}
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-[#5B6980] border-t border-[#DDE3EA] pt-4">{LEYENDA_ALCANCE_SELLO}</p>
    </article>
  );
}
