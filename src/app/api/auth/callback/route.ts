import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Maneja el callback de OAuth y magic links de Supabase.
 * Soporta:
 * - Magic link de invitación (inviteUserByEmail)
 * - Confirmación de email (signUp)
 * - OAuth providers
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  // Usuario invitado (tipo invite) → redirigir a onboarding para completar perfil
  if (type === "invite" || data.user?.user_metadata?.invited_at) {
    return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }

  return res;
}
