import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { IconChecklist } from "@tabler/icons-react";
import { TareasChecklist } from "./TareasChecklist";
import { NuevaTareaButton } from "./NuevaTareaButton";
import type { UserRole } from "@/server/trpc/context";
import { esRolGestion } from "@/lib/roles";

export default async function TareasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true, nombre: true },
  });

  const userRole = (dbUser?.rol as UserRole | undefined) ?? null;
  const canManage = esRolGestion(userRole);

  const today = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconChecklist size={26} className="text-[#2F6B2A]" />
            Tareas del día
          </h1>
          <p className="text-sm text-[#5B6980] mt-1 capitalize">{today}</p>
        </div>
        {canManage && <NuevaTareaButton />}
      </div>

      <TareasChecklist userRole={userRole} />
    </div>
  );
}
