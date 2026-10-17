import { getCaller } from "@/lib/trpc/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { cookies } from "next/headers";
import { formatDate } from "@/lib/utils";
import {
  IconMapPin,
  IconCircleCheck,
  IconAlertTriangle,
  IconClock,
} from "@tabler/icons-react";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { NuevaVisitaButton } from "./NuevaVisitaButton";
import { CerrarNcButton } from "./CerrarNcButton";
import type { UserRole } from "@/server/trpc/context";
import { puedeOperarLocal } from "@/lib/roles";
import {
  ETIQUETA_RESULTADO,
  leerEvaluacion,
  puntoDe,
  type ResultadoPauta,
} from "@/lib/bpm/visita";

export default async function VisitasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const tenantActivo = cookieStore.get("tenant_activo")?.value ?? null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });
  const userRole = (dbUser?.rol as UserRole | undefined) ?? null;

  // Resolver tenantId para asesor (usa tenantActivo o el primer tenant disponible)
  let tenantId = tenantActivo;
  if (!tenantId) {
    const ut = await prisma.userTenant.findFirst({
      where: { user_id: user.id },
      select: { tenant_id: true },
    });
    tenantId = ut?.tenant_id ?? null;
  }

  if (userRole === "trabajador_local") {
    return (
      <div className="text-center py-16 text-[#5B6980]">
        <IconMapPin size={40} className="mx-auto mb-3 text-[#DDE3EA]" />
        <p className="text-sm">No tienes acceso a este módulo.</p>
      </div>
    );
  }

  const caller = await getCaller();
  const visitasResult = await caller.visitas.list({ limit: 20 }).catch(() => []);
  const noConformidades = visitasResult.flatMap((visita) => visita.no_conformidades);
  const abiertas = noConformidades.filter((nc) => nc.estado === "abierta");
  const mayores = abiertas.filter((nc) => nc.severidad === "mayor");
  const scores = (
    <ScoreCards
      items={[
        { label: "Visitas", value: visitasResult.length, hint: "Últimas registradas", tone: "neutral" },
        { label: "NC abiertas", value: abiertas.length, hint: "Por cerrar", tone: abiertas.length > 0 ? "alerta" : "ok" },
        { label: "Mayores", value: mayores.length, hint: "Abiertas y graves", tone: mayores.length > 0 ? "alerta" : "ok" },
        {
          label: "Sin pendientes",
          value: visitasResult.filter((visita) => visita.no_conformidades.every((nc) => nc.estado !== "abierta")).length,
          hint: "Visitas al día",
          tone: "ok",
        },
      ]}
    />
  );

  if (visitasResult.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader userRole={userRole} tenantId={tenantId} />
        {scores}
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader userRole={userRole} tenantId={tenantId} />
      {scores}

      <div className="space-y-4">
        {visitasResult.map((visita) => {
          const ncAbiertas = visita.no_conformidades.filter((nc) => nc.estado === "abierta");
          const hasMayores = visita.no_conformidades.some((nc) => nc.severidad === "mayor" && nc.estado === "abierta");

          return (
            <div
              key={visita.id}
              className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5"
            >
              {/* Header visita */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IconMapPin size={16} className="text-[#2F6B2A] shrink-0" />
                    <span className="font-semibold text-[#0B1B33] text-sm">
                      Visita {visita.tipo === "programada" ? "Programada" : "Sorpresa"}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6980]">{formatDate(visita.fecha)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasMayores && (
                    <span className="text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
                      <IconAlertTriangle size={12} />
                      {ncAbiertas.filter((nc) => nc.severidad === "mayor").length} mayor
                    </span>
                  )}
                  {ncAbiertas.length > 0 ? (
                    <span className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 font-medium">
                      {ncAbiertas.length} pendiente{ncAbiertas.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
                      <IconCircleCheck size={12} />
                      Cerrada
                    </span>
                  )}
                </div>
              </div>

              <PautaResumen evaluacion={visita.evaluacion} />

              {visita.hallazgos && (
                <p className="text-sm text-[#334155] mb-4 bg-[#F4F6F3] rounded-lg p-3">
                  {visita.hallazgos}
                </p>
              )}

              {/* No conformidades */}
              {visita.no_conformidades.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#5B6980] mb-2">
                    No conformidades ({visita.no_conformidades.length})
                  </p>
                  <div className="space-y-2">
                    {visita.no_conformidades.map((nc) => (
                        <div
                          key={nc.id}
                          className={`rounded-xl p-3 text-sm border ${
                            nc.estado === "cerrada"
                              ? "bg-[#F4F6F3] border-[#DDE3EA] opacity-60"
                              : nc.severidad === "mayor"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {nc.estado === "cerrada" ? (
                              <IconCircleCheck size={16} className="text-[#2F6B2A] shrink-0 mt-0.5" />
                            ) : (
                              <IconAlertTriangle
                                size={16}
                                className={`shrink-0 mt-0.5 ${nc.severidad === "mayor" ? "text-[#B42318]" : "text-[#D97706]"}`}
                              />
                            )}
                            <div className="flex-1">
                              {nc.area && (
                                <p className="text-[11px] font-medium text-[#5B6980] mb-0.5">
                                  {puntoDe(nc.area)?.nombre ?? nc.area}
                                </p>
                              )}
                              <p className={nc.estado === "cerrada" ? "text-[#5B6980] line-through" : "text-[#0B1B33]"}>
                                {nc.descripcion}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-[#5B6980] capitalize">{nc.severidad}</span>
                                {nc.fecha_limite && (
                                  <span className="flex items-center gap-1 text-xs text-[#5B6980]">
                                    <IconClock size={11} />
                                    {formatDate(nc.fecha_limite)}
                                  </span>
                                )}
                              </div>
                              {/* Solo el admin_local puede cerrar NC */}
                              {nc.estado !== "cerrada" && puedeOperarLocal(userRole) && (
                                <CerrarNcButton ncId={nc.id} descripcion={nc.descripcion} />
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PageHeader({
  userRole,
  tenantId,
}: {
  userRole: UserRole | null;
  tenantId: string | null;
}) {
  const canCreate = userRole === "asesor" || userRole === "admin_nucleo";
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Visitas</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Cada visita recorre la pauta del local y deja la no conformidad en el punto que falló.
        </p>
      </div>
      {canCreate && tenantId && (
        <NuevaVisitaButton tenantId={tenantId} />
      )}
    </div>
  );
}

const COLOR_RESULTADO: Record<ResultadoPauta, string> = {
  cumple: "text-[#255620]",
  observacion: "text-[#92400E]",
  no_cumple: "text-[#991B1B]",
  no_revisada: "text-[#94A3B8]",
};

function PautaResumen({ evaluacion }: { evaluacion: unknown }) {
  const items = leerEvaluacion(evaluacion);
  if (!items) return null;
  const revisados = items.filter((item) => item.resultado !== "no_revisada");
  const omitidos = items.length - revisados.length;

  return (
    <div className="mb-4">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {revisados.map((item) => (
          <li key={item.area} className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-[#334155]">{puntoDe(item.area)?.nombre ?? item.area}</span>
            <span className={`shrink-0 font-medium ${COLOR_RESULTADO[item.resultado]}`}>
              {ETIQUETA_RESULTADO[item.resultado]}
            </span>
          </li>
        ))}
      </ul>
      {omitidos > 0 && (
        <p className="text-xs text-[#94A3B8] mt-2">
          {omitidos} punto{omitidos === 1 ? "" : "s"} sin revisar en esta visita.
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#E5F1E3] flex items-center justify-center mx-auto mb-3">
        <IconMapPin size={24} className="text-[#2F6B2A]" />
      </div>
      <p className="font-semibold text-[#0B1B33]">Sin visitas registradas</p>
      <p className="text-sm text-[#5B6980] mt-1">
        Las visitas de tu asesor aparecerán aquí.
      </p>
    </div>
  );
}
