import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { IconMessage2 } from "@tabler/icons-react";
import { EnviarMensajeButton } from "./EnviarMensajeButton";
import { MensajesList } from "./MensajesList";

export default async function ComunicacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant_activo")?.value ?? undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconMessage2 size={26} className="text-[#2F6B2A]" />
            Comunicaciones
          </h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Mensajes con tu asesor y equipo
          </p>
        </div>
        <EnviarMensajeButton />
      </div>

      <MensajesList userId={user?.id ?? ""} tenantId={tenantId} />
    </div>
  );
}
