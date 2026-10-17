import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { redirect } from "next/navigation";
import { SelloBadge, type NivelSello } from "@/components/sellos/SelloBadge";
import { IconBuildingStore, IconMedal } from "@tabler/icons-react";
import { getCurrentPeriodo } from "@/lib/utils";
import { SwitchLocalButton } from "./SwitchLocalButton";
import { ScoreCards } from "@/components/dashboard/ScoreCards";

export default async function MisLocalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userTenants = await prisma.userTenant.findMany({
    where: { user_id: user.id },
    include: {
      tenant: {
        include: {
          sellos: {
            where: { periodo: getCurrentPeriodo() },
            take: 1,
          },
          _count: { select: { registros: true, documentos: true } },
        },
      },
    },
  });

  // Solo mostrar si tiene más de 1 local
  if (userTenants.length <= 1) redirect("/");

  const conSello = userTenants.filter(({ tenant }) => tenant.sellos[0]).length;
  const puntajes = userTenants.flatMap(({ tenant }) => (tenant.sellos[0] ? [tenant.sellos[0].score_general] : []));
  const promedio = puntajes.length > 0 ? Math.round(puntajes.reduce((suma, valor) => suma + valor, 0) / puntajes.length) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Mis Locales</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Resumen de todos tus locales — {getCurrentPeriodo()}
        </p>
      </div>

      <ScoreCards
        items={[
          { label: "Locales", value: userTenants.length, hint: "A tu cargo", tone: "neutral" },
          { label: "Con sello", value: conSello, hint: "Del período", tone: conSello === userTenants.length ? "ok" : "alerta" },
          { label: "Sin sello", value: userTenants.length - conSello, hint: "Aún no emitido", tone: userTenants.length - conSello > 0 ? "alerta" : "ok" },
          { label: "Promedio", value: promedio === null ? "—" : promedio, hint: "Puntaje del mes", tone: promedio !== null && promedio >= 75 ? "ok" : "neutral" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {userTenants.map(({ tenant }) => {
          const selloActual = tenant.sellos[0];

          return (
            <div
              key={tenant.id}
              className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E5F1E3] flex items-center justify-center shrink-0">
                    <IconBuildingStore size={20} className="text-[#2F6B2A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0B1B33]">{tenant.nombre}</p>
                    <p className="text-xs text-[#5B6980] capitalize">Plan {tenant.plan}</p>
                  </div>
                </div>
                {selloActual ? (
                  <SelloBadge
                    nivel={selloActual.nivel as NivelSello}
                    size="sm"
                    showIcon
                  />
                ) : (
                  <span className="text-xs text-[#5B6980]">Sin sello</span>
                )}
              </div>

              {selloActual && (
                <div className="flex items-center gap-2 mb-3">
                  <IconMedal size={14} className="text-[#5B6980]" />
                  <span className="text-sm font-bold text-[#0B1B33]">
                    {selloActual.score_general.toFixed(0)}%
                  </span>
                  <span className="text-xs text-[#5B6980]">cumplimiento</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-[#F4F6F3] rounded-lg px-3 py-2">
                  <p className="text-[#5B6980]">Registros</p>
                  <p className="font-semibold text-[#0B1B33]">{tenant._count.registros}</p>
                </div>
                <div className="bg-[#F4F6F3] rounded-lg px-3 py-2">
                  <p className="text-[#5B6980]">Documentos</p>
                  <p className="font-semibold text-[#0B1B33]">{tenant._count.documentos}</p>
                </div>
              </div>

              <SwitchLocalButton tenantId={tenant.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
