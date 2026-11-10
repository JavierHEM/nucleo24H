type PropiedadesLink = {
  hashed_token?: string | null;
  verification_type?: string | null;
};

const RUTAS_QUE_NO_SON_DESTINO = new Set(["/onboarding", "/login", "/register", "/api/auth/callback"]);

export function nextSeguro(valor: string | null | undefined) {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) {
    return "/";
  }
  return valor;
}

/** A dónde ir después de crear la clave. Nunca devolver /onboarding: eso deja el spinner eterno. */
export function destinoTrasOnboarding(valor: string | null | undefined, rol?: string | null) {
  if (rol === "admin_nucleo") return "/admin";
  if (rol === "asesor") return "/asesor/informes";
  const limpio = nextSeguro(valor);
  if (RUTAS_QUE_NO_SON_DESTINO.has(limpio)) return "/";
  return limpio;
}

/** redirectTo de generateLink: tiene que estar en Authentication → URL Configuration. */
export function redirectInvitacion(appUrl: string) {
  return `${appUrl.replace(/\/$/, "")}/api/auth/callback`;
}

/** Link propio de la app. El de Supabase deja la sesión en el fragmento y el servidor nunca la ve. */
export function enlaceDeAcceso(
  appUrl: string,
  properties: PropiedadesLink | null | undefined,
  next = "/"
) {
  const token = properties?.hashed_token;
  if (!token) return null;

  const url = new URL("/api/auth/callback", appUrl);
  url.searchParams.set("token_hash", token);
  url.searchParams.set("type", properties?.verification_type || "invite");
  url.searchParams.set("next", nextSeguro(next));
  return url.toString();
}
