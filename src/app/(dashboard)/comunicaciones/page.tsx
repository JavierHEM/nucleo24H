import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { IconMessage2 } from "@tabler/icons-react";
import { NuevaPeticionButton } from "./NuevaPeticionButton";
import { TicketList } from "./TicketList";
import { esLocalComunicaciones, esStaffNucleo } from "@/lib/comunicaciones/tickets";

export default async function ComunicacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } });
  const rol = dbUser?.rol ?? null;

  if (rol === "trabajador_local") {
    return (
      <div className="text-center py-16 text-[#5B6980]">
        <IconMessage2 size={40} className="mx-auto mb-3 text-[#DDE3EA]" />
        <p className="text-sm">Las peticiones las envía el dueño o el jefe del local.</p>
      </div>
    );
  }

  const esLocal = esLocalComunicaciones(rol);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconMessage2 size={26} className="text-[#2F6B2A]" />
            Peticiones
          </h1>
          <p className="text-sm text-[#5B6980] mt-1">
            {esStaffNucleo(rol)
              ? "Solicitudes de los locales. Ábrela, responde y márcala como resuelta."
              : "Escribe a Núcleo 24H. Tu asesor o casa central atiende cada petición."}
          </p>
        </div>
        {esLocal && <NuevaPeticionButton />}
      </div>

      <TicketList userRole={rol} />
    </div>
  );
}
