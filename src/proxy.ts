import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isPublicPath } from "@/lib/auth/rutasPublicas";

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

  // Visitante sin sesión en la raíz → landing público (rewrite, la URL sigue siendo "/")
  if (!user && pathname === "/") {
    return NextResponse.rewrite(new URL("/inicio", req.url));
  }

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Usuario autenticado que entra al landing → su panel
  if (user && pathname === "/inicio") {
    return NextResponse.redirect(new URL("/", req.url));
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
