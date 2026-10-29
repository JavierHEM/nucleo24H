export const PUBLIC_PREFIXES = [
  "/inicio",
  "/login",
  "/register",
  "/onboarding",
  "/cuenta/nueva-clave",
  "/politica-de-privacidad",
  "/api/auth",
  "/api/trpc",
  "/api/cron",
  "/api/webhooks",
  "/api/pagos/retorno",
  "/api/local",
  "/sello/",
] as const;

/** Ruta pública solo si coincide o sigue el borde `/`. `/login` no abre `/loginX`. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => {
    if (pathname === prefix) return true;
    const boundary = prefix.endsWith("/") ? prefix : `${prefix}/`;
    return pathname.startsWith(boundary);
  });
}
