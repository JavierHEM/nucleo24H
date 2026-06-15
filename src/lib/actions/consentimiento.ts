"use server";

import { headers } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { createClient } from "@/lib/supabase/server";

// RF-55: Registrar consentimiento al completar el registro — Art. 12 Ley 21.719
export async function registrarConsentimientoInicial(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "0.0.0.0";

  try {
    await prisma.$executeRawUnsafe(
      `SET app.current_tenant = '${tenantId}'`
    );

    await prisma.consentimiento.create({
      data: {
        tenant_id: tenantId,
        titular_id: user.id,
        tipo: "otorgamiento",
        documento_version: "v1.0",
        timestamp_evento: new Date(),
        ip_origen: ip,
        canal: "web",
      },
    });

    return { data: "ok" };
  } catch (err) {
    console.error("[consentimiento] Error al registrar:", err);
    return { error: "No se pudo registrar el consentimiento" };
  }
}
