export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { BannerMora } from "@/components/dashboard/BannerMora";
import type { UserRole } from "@/server/trpc/context";

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
    select: { nombre: true, rol: true },
  });

  const userRole = (dbUserEarly?.rol as UserRole | undefined) ?? null;
  const userName = dbUserEarly?.nombre ?? user.email?.split("@")[0] ?? "Usuario";

  // admin_nucleo puede acceder a todos los locales del sistema
  let locales: { id: string; nombre: string }[];
  if (userRole === "admin_nucleo") {
    locales = await prisma.tenant.findMany({
      where: { estado: "activo" },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  } else {
    const userTenants = await prisma.userTenant.findMany({
      where: { user_id: user.id },
      include: { tenant: { select: { id: true, nombre: true } } },
    });
    locales = userTenants.map((ut) => ut.tenant);
  }

  const tenantActivo =
    tenantActivoCookie && locales.some((l) => l.id === tenantActivoCookie)
      ? tenantActivoCookie
      : locales[0]?.id ?? null;


  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6F8]">
      <Sidebar userRole={userRole} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          userName={userName}
          locales={locales}
          tenantActivo={tenantActivo ?? undefined}
          userRole={userRole}
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          {tenantActivo && userRole && (
            <div className="px-4 md:px-6 pt-4 md:pt-6">
              <BannerMora tenantId={tenantActivo} userRole={userRole} />
            </div>
          )}
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
      <BottomNav userRole={userRole} />
    </div>
  );
}
