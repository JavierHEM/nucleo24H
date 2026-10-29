import { redirect } from "next/navigation";
import { getCaller } from "@/lib/trpc/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { planIncluye } from "@/lib/planes";
import { ModuloBloqueado } from "@/components/plan/ModuloBloqueado";
import { AmbientalPanel } from "./AmbientalPanel";

export default async function AmbientalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } });
  if (!dbUser || dbUser.rol === "trabajador_local") redirect("/");

  const caller = await getCaller();
  const { plan } = await caller.plan.actual();

  if (!planIncluye(plan, "ambiental")) {
    return <ModuloBloqueado modulo="ambiental" titulo="Gestión ambiental" planActual={plan} />;
  }

  return <AmbientalPanel puedeRegistrar={dbUser.rol === "asesor" || dbUser.rol === "admin_nucleo"} />;
}
