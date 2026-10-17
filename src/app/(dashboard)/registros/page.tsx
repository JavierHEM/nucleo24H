import { IconClipboardList } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { puedeOperarLocal } from "@/lib/roles";
import { RegistrosList } from "./RegistrosList";
import { NuevoRegistroSheet } from "./NuevoRegistroSheet";
import { CargarPlanillaSheet } from "./CargarPlanillaSheet";

export default async function RegistrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dbUser = user
    ? await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconClipboardList size={26} className="text-[#2F6B2A]" />
            Registros BPM
          </h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Completa la planilla en el sistema o carga la que imprimiste.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {puedeOperarLocal(dbUser?.rol) && <CargarPlanillaSheet />}
          <NuevoRegistroSheet />
        </div>
      </div>
      <RegistrosList />
    </div>
  );
}
