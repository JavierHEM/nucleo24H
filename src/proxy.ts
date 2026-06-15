import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/onboarding",
  "/cuenta/nueva-clave",
  "/politica-de-privacidad",
  "/api/auth",
  "/api/trpc",
  "/api/cron",     // protegidas por CRON_SECRET
  "/api/webhooks", // Flow llama server-to-server sin sesión; verifica firma
  "/api/pagos/retorno", // POST de retorno desde Flow
  "/api/local",    // rutas de gestión de local (auth propia por cookies)
  "/sello/",       // certificados públicos de sello (verificación externa)
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

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
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(pathname)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // /admin → solo admin_nucleo
  // /asesor → solo asesor (o admin_nucleo que también puede verlo)
  if (pathname.startsWith("/admin") || pathname.startsWith("/asesor")) {
    const rol = user?.app_metadata?.rol as string | undefined;
    if (pathname.startsWith("/admin") && rol !== "admin_nucleo") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/asesor") && rol !== "asesor" && rol !== "admin_nucleo") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)).*)",
  ],
};
