type PropiedadesLink = {
  hashed_token?: string | null;
  verification_type?: string | null;
};

export function nextSeguro(valor: string | null | undefined) {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) {
    return "/";
  }
  return valor;
}

/** Link propio de la app. El de Supabase deja la sesión en el fragmento y el servidor nunca la ve. */
export function enlaceDeAcceso(
  appUrl: string,
  properties: PropiedadesLink | null | undefined,
  next = "/onboarding"
) {
  const token = properties?.hashed_token;
  if (!token) return null;

  const url = new URL("/api/auth/callback", appUrl);
  url.searchParams.set("token_hash", token);
  url.searchParams.set("type", properties?.verification_type || "invite");
  url.searchParams.set("next", nextSeguro(next));
  return url.toString();
}
