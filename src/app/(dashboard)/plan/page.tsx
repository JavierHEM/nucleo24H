import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { MiPlan } from "./MiPlan";

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } });
  if (!dbUser || dbUser.rol === "trabajador_local") redirect("/");

  return <MiPlan puedeVerPagos={dbUser.rol === "admin_local" || dbUser.rol === "admin_nucleo"} />;
}
