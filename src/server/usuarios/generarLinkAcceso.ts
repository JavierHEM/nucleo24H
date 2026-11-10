import { createAdminClient } from "@/lib/supabase/admin";
import { redirectInvitacion } from "@/lib/auth/enlaceInvitacion";
import { tipoLinkAcceso } from "@/lib/auth/reenviarInvitacion";
import { getAppUrl } from "@/lib/branding";

export async function generarLinkAcceso(args: {
  email: string;
  nombre?: string;
  emailConfirmado: boolean;
}): Promise<{
  appUrl: string;
  properties: { hashed_token?: string | null; verification_type?: string | null } | null;
  error: Error | null;
}> {
  const admin = createAdminClient();
  const appUrl = getAppUrl();
  const redirectTo = redirectInvitacion(appUrl);
  const tipo = tipoLinkAcceso(args.emailConfirmado);

  if (tipo === "invite") {
    const invite = await admin.auth.admin.generateLink({
      type: "invite",
      email: args.email,
      options: {
        data: args.nombre ? { nombre: args.nombre } : undefined,
        redirectTo,
      },
    });
    if (!invite.error && invite.data?.properties?.hashed_token) {
      return { appUrl, properties: invite.data.properties, error: null };
    }
    console.warn("[generarLinkAcceso] invite falló, uso magiclink:", invite.error?.message);
  }

  const magic = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: args.email,
    options: { redirectTo },
  });
  if (magic.error || !magic.data?.properties?.hashed_token) {
    return {
      appUrl,
      properties: magic.data?.properties ?? null,
      error: magic.error ?? new Error("No se pudo generar el enlace."),
    };
  }
  return { appUrl, properties: magic.data.properties, error: null };
}
