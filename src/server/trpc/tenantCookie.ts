import type { NextRequest } from "next/server";

export const COOKIE_TENANT_ACTIVO = "tenant_activo";

/**
 * En el route handler tRPC llega el Request. En RSC, `getCaller()` no tiene Request
 * y hay que leer la cookie con `cookies()` de Next; si no, el local activo se pierde
 * y se usa el primero de la lista (otro puntaje de sello).
 */
export async function leerCookieTenantActivo(req?: NextRequest): Promise<string | undefined> {
  if (req) return req.cookies.get(COOKIE_TENANT_ACTIVO)?.value;

  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    return store.get(COOKIE_TENANT_ACTIVO)?.value;
  } catch {
    return undefined;
  }
}
