import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { puedeOperarLocal } from "@/lib/roles";
import { FiscalizacionesVista } from "./FiscalizacionesVista";

export default async function FiscalizacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } });
  if (!dbUser || dbUser.rol === "trabajador_local") redirect("/");

  return (
    <FiscalizacionesVista
      esStaff={dbUser.rol === "asesor" || dbUser.rol === "admin_nucleo"}
      puedeAdjuntar={puedeOperarLocal(dbUser.rol)}
    />
  );
}
