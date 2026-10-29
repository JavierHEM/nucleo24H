import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { CalendarioVista } from "./CalendarioVista";

export default async function CalendarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } });
  if (!dbUser || dbUser.rol === "trabajador_local") redirect("/");

  const cookieStore = await cookies();
  let tenantId = cookieStore.get("tenant_activo")?.value ?? null;
  if (!tenantId) {
    const membresia = await prisma.userTenant.findFirst({ where: { user_id: user.id }, select: { tenant_id: true } });
    tenantId = membresia?.tenant_id ?? null;
  }

  return (
    <CalendarioVista
      tenantId={tenantId}
      puedeAgendar={dbUser.rol === "asesor" || dbUser.rol === "admin_nucleo"}
    />
  );
}
