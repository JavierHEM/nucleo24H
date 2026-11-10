import { createAdminClient } from "@/lib/supabase/admin";
import { redirectInvitacion } from "@/lib/auth/enlaceInvitacion";
import { tipoLinkAcceso } from "@/lib/auth/reenviarInvitacion";
import { getAppUrl } from "@/lib/branding";
import { prisma } from "@/server/db/prisma";
import { normalizarEmail } from "@/lib/auth/email";

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
      await marcarTokenVigente(args.email);
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
  await marcarTokenVigente(args.email);
  return { appUrl, properties: magic.data.properties, error: null };
}

/** GoTrue trata expires_at NULL como vencido y el verify responde otp_expired. */
async function marcarTokenVigente(email: string) {
  const correo = normalizarEmail(email);
  await prisma.$executeRaw`
    UPDATE auth.one_time_tokens
    SET expires_at = now() + interval '24 hours'
    WHERE lower(relates_to) = ${correo}
      AND (expires_at IS NULL OR expires_at < now())
  `;
}
