export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true, nombre: true },
  });

  if (dbUser?.rol !== "admin_nucleo") redirect("/");

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F3]">
      <Sidebar userRole="admin_nucleo" mode="admin" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar userName={dbUser.nombre} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav userRole="admin_nucleo" mode="admin" />
    </div>
  );
}
