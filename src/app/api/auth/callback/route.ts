import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { nextSeguro } from "@/lib/auth/enlaceInvitacion";

const TIPOS_OTP: EmailOtpType[] = ["invite", "magiclink", "recovery", "signup", "email"];

function esTipoOtp(valor: string | null): valor is EmailOtpType {
  return TIPOS_OTP.includes(valor as EmailOtpType);
}

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
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (tokenHash && esTipoOtp(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      console.error("[auth/callback] verifyOtp:", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback`);
    }

    const invitado = type === "invite" || Boolean(data.user?.invited_at);
    const destino = invitado ? `${origin}/onboarding?next=${encodeURIComponent(next)}` : `${origin}${next}`;
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

  if (type === "invite" || data.user?.invited_at || data.user?.user_metadata?.invited_at) {
    res.headers.set("Location", `${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }

  return res;
}
