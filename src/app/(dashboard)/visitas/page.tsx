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
import { NuevaVisitaButton } from "./NuevaVisitaButton";
import { CerrarNcButton } from "./CerrarNcButton";
import type { UserRole } from "@/server/trpc/context";
import { puedeOperarLocal } from "@/lib/roles";

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
      <div className="text-center py-16 text-[#64748B]">
        <IconMapPin size={40} className="mx-auto mb-3 text-[#E2E8F0]" />
        <p className="text-sm">No tienes acceso a este módulo.</p>
      </div>
    );
  }

  const caller = await getCaller();
  const visitasResult = await caller.visitas.list({ limit: 20 }).catch(() => []);

  if (visitasResult.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader userRole={userRole} tenantId={tenantId} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader userRole={userRole} tenantId={tenantId} />

      <div className="space-y-4">
        {visitasResult.map((visita) => {
          const ncAbiertas = visita.no_conformidades.filter((nc) => nc.estado === "abierta");
          const hasMayores = visita.no_conformidades.some((nc) => nc.severidad === "mayor" && nc.estado === "abierta");

          return (
            <div
              key={visita.id}
              className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5"
            >
              {/* Header visita */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IconMapPin size={16} className="text-[#4B8B2E] shrink-0" />
                    <span className="font-semibold text-[#0B2545] text-sm">
                      Visita {visita.tipo === "programada" ? "Programada" : "Sorpresa"}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">{formatDate(visita.fecha)}</p>
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

              {/* Hallazgos */}
              {visita.hallazgos && (
                <p className="text-sm text-[#334155] mb-4 bg-[#F8F9FA] rounded-lg p-3">
                  {visita.hallazgos}
                </p>
              )}

              {/* No conformidades */}
              {visita.no_conformidades.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#64748B] mb-2">
                    No conformidades ({visita.no_conformidades.length})
                  </p>
                  <div className="space-y-2">
                    {visita.no_conformidades.map((nc) => (
                        <div
                          key={nc.id}
                          className={`rounded-xl p-3 text-sm border ${
                            nc.estado === "cerrada"
                              ? "bg-[#F8F9FA] border-[#E2E8F0] opacity-60"
                              : nc.severidad === "mayor"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {nc.estado === "cerrada" ? (
                              <IconCircleCheck size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
                            ) : (
                              <IconAlertTriangle
                                size={16}
                                className={`shrink-0 mt-0.5 ${nc.severidad === "mayor" ? "text-[#DC2626]" : "text-[#D97706]"}`}
                              />
                            )}
                            <div className="flex-1">
                              <p className={nc.estado === "cerrada" ? "text-[#64748B] line-through" : "text-[#0B2545]"}>
                                {nc.descripcion}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-[#64748B] capitalize">{nc.severidad}</span>
                                {nc.fecha_limite && (
                                  <span className="flex items-center gap-1 text-xs text-[#64748B]">
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
        <h1 className="text-2xl font-bold text-[#0B2545]">Visitas</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Historial de visitas del asesor y no conformidades
        </p>
      </div>
      {canCreate && tenantId && (
        <NuevaVisitaButton tenantId={tenantId} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#EBF5E6] flex items-center justify-center mx-auto mb-3">
        <IconMapPin size={24} className="text-[#4B8B2E]" />
      </div>
      <p className="font-semibold text-[#0B2545]">Sin visitas registradas</p>
      <p className="text-sm text-[#64748B] mt-1">
        Las visitas de tu asesor aparecerán aquí.
      </p>
    </div>
  );
}
