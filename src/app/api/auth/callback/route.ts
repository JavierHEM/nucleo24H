export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { destinoTrasOnboarding, esTipoOtp, nextSeguro, tiposOtpAProbar } from "@/lib/auth/enlaceInvitacion";
import { syncUserClaims } from "@/lib/supabase/claims";

/**
 * Cierra el enlace de invitación, el magic link y la confirmación de correo.
 * La sesión queda en cookies de esta respuesta.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = nextSeguro(searchParams.get("next"));

  const res = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: origin.startsWith("https"),
            });
          });
        },
      },
    }
  );

  if (tokenHash) {
    let user = null;
    let tipoUsado: EmailOtpType | null = esTipoOtp(type) ? type : null;
    let ultimoError: string | null = null;

    for (const tipo of tiposOtpAProbar(type)) {
      const intento = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
      if (!intento.error && intento.data.user) {
        user = intento.data.user;
        tipoUsado = tipo;
        ultimoError = null;
        break;
      }
      ultimoError = intento.error?.message ?? ultimoError;
    }

    if (!user) {
      console.error("[auth/callback] verifyOtp:", ultimoError);
      return NextResponse.redirect(`${origin}/login?error=auth_callback`);
    }

    await syncUserClaims(user.id).catch((err) =>
      console.error("[auth/callback] syncUserClaims:", err)
    );

    const invitado = tipoUsado === "invite" || Boolean(user.invited_at);
    const rol = typeof user.app_metadata?.rol === "string" ? user.app_metadata.rol : null;
    const despues = destinoTrasOnboarding(next, rol);
    const destino = invitado
      ? `${origin}/onboarding?next=${encodeURIComponent(despues)}`
      : `${origin}${despues}`;
    res.headers.set("Location", destino);
    return res;
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] Error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  if (data.user?.id) {
    await syncUserClaims(data.user.id).catch((err) =>
      console.error("[auth/callback] syncUserClaims:", err)
    );
  }

  if (type === "invite" || data.user?.invited_at || data.user?.user_metadata?.invited_at) {
    const rol = typeof data.user?.app_metadata?.rol === "string" ? data.user.app_metadata.rol : null;
    const despues = destinoTrasOnboarding(next, rol);
    res.headers.set("Location", `${origin}/onboarding?next=${encodeURIComponent(despues)}`);
  }

  return res;
}
