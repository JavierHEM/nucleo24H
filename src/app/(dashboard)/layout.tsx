export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { Sidebar, type PlanLocal } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { BannerMora } from "@/components/dashboard/BannerMora";
import { BannerDeclaracionD } from "@/components/dashboard/BannerDeclaracionD";
import { BannerRenovacion } from "@/components/plan/BannerRenovacion";
import type { UserRole } from "@/server/trpc/context";
import { PLAN_PRECIOS_CLP } from "@/lib/payments/flow";
import { planDeLocal } from "@/server/planes/planDeLocal";
import { localesVisibles } from "@/server/locales/visibles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Leer tenant_activo desde cookie
  const cookieStore = await cookies();
  const tenantActivoCookie = cookieStore.get("tenant_activo")?.value;

  // Rol del usuario (necesitamos el rol ANTES de decidir qué locales cargar)
  const dbUserEarly = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nombre: true, rol: true, activo: true },
  });

  if (dbUserEarly && !dbUserEarly.activo) {
    await supabase.auth.signOut();
    redirect("/login?error=cuenta_baja");
  }

  const userRole = (dbUserEarly?.rol as UserRole | undefined) ?? null;
  const userName = dbUserEarly?.nombre ?? user.email?.split("@")[0] ?? "Usuario";

  const locales = await localesVisibles(user.id, userRole);

  const tenantActivo =
    tenantActivoCookie && locales.some((l) => l.id === tenantActivoCookie)
      ? tenantActivoCookie
      : locales[0]?.id ?? null;

  const infoPlan = tenantActivo ? await planDeLocal(prisma, tenantActivo) : null;
  let plan: PlanLocal | null = null;
  if (tenantActivo && userRole === "admin_local") {
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { tenant_id: tenantActivo },
      select: { plan: true, estado: true, monto_clp: true, dia_cobro: true },
    });
    const tenant = suscripcion
      ? null
      : await prisma.tenant.findUnique({ where: { id: tenantActivo }, select: { plan: true } });
    const nombrePlan = suscripcion?.plan ?? tenant?.plan;
    if (nombrePlan) {
      plan = {
        nombre: nombrePlan === "integral" ? "Integral" : "Calidad",
        estado: suscripcion?.estado ?? "activa",
        monto: suscripcion?.monto_clp ?? PLAN_PRECIOS_CLP[nombrePlan] ?? PLAN_PRECIOS_CLP.calidad,
        diaCobro: suscripcion?.dia_cobro ?? 5,
      };
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F3] print:block print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden contents">
        <Sidebar
          userRole={userRole}
          plan={plan}
          planId={infoPlan?.plan}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="print:hidden">
          <TopBar
            userName={userName}
            locales={locales}
            tenantActivo={tenantActivo ?? undefined}
            userRole={userRole}
          />
        </div>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 print:overflow-visible print:pb-0">
          {tenantActivo && userRole && (
            <div className="print:hidden px-4 md:px-6 pt-4 md:pt-6">
              <BannerMora tenantId={tenantActivo} userRole={userRole} />
              <BannerRenovacion tenantId={tenantActivo} userRole={userRole} />
              {(userRole === "admin_local" || userRole === "jefe_local") && <BannerDeclaracionD />}
            </div>
          )}
          <div className="p-4 md:p-6 w-full min-w-0 print:p-0">
            {children}
          </div>
        </main>
      </div>
      <div className="print:hidden">
        <BottomNav userRole={userRole} planId={infoPlan?.plan} />
      </div>
    </div>
  );
}
