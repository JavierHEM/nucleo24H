import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { redirect } from "next/navigation";
import { SelloBadge, type NivelSello } from "@/components/sellos/SelloBadge";
import { IconBuildingStore, IconMedal } from "@tabler/icons-react";
import { getCurrentPeriodo } from "@/lib/utils";
import { SwitchLocalButton } from "./SwitchLocalButton";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1F3C]">Mis Locales</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Resumen de todos tus locales — {getCurrentPeriodo()}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {userTenants.map(({ tenant }) => {
          const selloActual = tenant.sellos[0];

          return (
            <div
              key={tenant.id}
              className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3E0] flex items-center justify-center shrink-0">
                    <IconBuildingStore size={20} className="text-[#3D7A35]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0D1F3C]">{tenant.nombre}</p>
                    <p className="text-xs text-[#64748B] capitalize">Plan {tenant.plan}</p>
                  </div>
                </div>
                {selloActual ? (
                  <SelloBadge
                    nivel={selloActual.nivel as NivelSello}
                    size="sm"
                    showIcon
                  />
                ) : (
                  <span className="text-xs text-[#64748B]">Sin sello</span>
                )}
              </div>

              {selloActual && (
                <div className="flex items-center gap-2 mb-3">
                  <IconMedal size={14} className="text-[#64748B]" />
                  <span className="text-sm font-bold text-[#0D1F3C]">
                    {selloActual.score_general.toFixed(0)}%
                  </span>
                  <span className="text-xs text-[#64748B]">cumplimiento</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-[#F5F6F8] rounded-lg px-3 py-2">
                  <p className="text-[#64748B]">Registros</p>
                  <p className="font-semibold text-[#0D1F3C]">{tenant._count.registros}</p>
                </div>
                <div className="bg-[#F5F6F8] rounded-lg px-3 py-2">
                  <p className="text-[#64748B]">Documentos</p>
                  <p className="font-semibold text-[#0D1F3C]">{tenant._count.documentos}</p>
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
