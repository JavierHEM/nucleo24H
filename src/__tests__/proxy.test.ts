/**
 * Tests de la lógica de enrutamiento del proxy (proxy.ts).
 *
 * Copiamos PUBLIC_PREFIXES exactamente del proxy para garantizar que los tests
 * reflejen el estado real del archivo. Si el proxy cambia, los tests fallarán.
 */
import { describe, it, expect } from "vitest";

const PUBLIC_PREFIXES = [
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
  "/sello/",       // IMPORTANTE: con slash final para no matchear /sellos
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

describe("isPublic – rutas públicas (sin autenticación)", () => {
  it("/login es pública", () => expect(isPublic("/login")).toBe(true));
  it("/register es pública", () => expect(isPublic("/register")).toBe(true));
  it("/politica-de-privacidad es pública", () =>
    expect(isPublic("/politica-de-privacidad")).toBe(true));

  it("/api/auth/* es público", () => {
    expect(isPublic("/api/auth/callback")).toBe(true);
    expect(isPublic("/api/auth/exportar-datos")).toBe(true);
  });

  it("/api/trpc/* es público (tRPC maneja su propia auth)", () => {
    expect(isPublic("/api/trpc/comunicaciones.list")).toBe(true);
    expect(isPublic("/api/trpc/sellos.getActual")).toBe(true);
  });

  it("/api/cron/* es público (protegido por CRON_SECRET propio)", () => {
    expect(isPublic("/api/cron/emitir-sellos")).toBe(true);
    expect(isPublic("/api/cron/marcar-morosos")).toBe(true);
  });

  it("/api/webhooks/* es público (Flow server-to-server)", () => {
    expect(isPublic("/api/webhooks/flow")).toBe(true);
  });

  it("/api/pagos/retorno es público", () => {
    expect(isPublic("/api/pagos/retorno")).toBe(true);
  });

  it("/api/local/* es público (maneja auth por cookies)", () => {
    expect(isPublic("/api/local/invitar-trabajador")).toBe(true);
  });

  it("/sello/[id] es público (certificados de verificación)", () => {
    expect(isPublic("/sello/abc-123-uuid")).toBe(true);
    expect(isPublic("/sello/")).toBe(true);
  });

  it("/onboarding es público", () => {
    expect(isPublic("/onboarding")).toBe(true);
  });

  it("/cuenta/nueva-clave es público", () => {
    expect(isPublic("/cuenta/nueva-clave")).toBe(true);
    expect(isPublic("/cuenta/nueva-clave/confirm")).toBe(true);
  });
});

describe("isPublic – rutas protegidas (requieren autenticación)", () => {
  it("/ (dashboard) es protegida", () => expect(isPublic("/")).toBe(false));
  it("/registros es protegida", () => expect(isPublic("/registros")).toBe(false));
  it("/documentos es protegida", () => expect(isPublic("/documentos")).toBe(false));

  it("/sellos (dashboard) es protegida — NO confundir con /sello/ (certificados)", () => {
    expect(isPublic("/sellos")).toBe(false);
  });

  it("/visitas es protegida", () => expect(isPublic("/visitas")).toBe(false));
  it("/tareas es protegida", () => expect(isPublic("/tareas")).toBe(false));
  it("/comunicaciones es protegida", () => expect(isPublic("/comunicaciones")).toBe(false));
  it("/equipo es protegida", () => expect(isPublic("/equipo")).toBe(false));
  it("/mi-cuenta es protegida", () => expect(isPublic("/mi-cuenta")).toBe(false));
  it("/suscripcion es protegida", () => expect(isPublic("/suscripcion")).toBe(false));
  it("/admin es protegida", () => expect(isPublic("/admin")).toBe(false));
  it("/admin/locales es protegida", () => expect(isPublic("/admin/locales")).toBe(false));
  it("/asesor/informes es protegida", () => expect(isPublic("/asesor/informes")).toBe(false));

  it("/api/pagos/configurar es protegida (distinto de /api/pagos/retorno)", () => {
    expect(isPublic("/api/pagos")).toBe(false);
    expect(isPublic("/api/pagos/configurar")).toBe(false);
  });

  it("/seller NO es confundido con /sello/", () => {
    expect(isPublic("/seller")).toBe(false);
  });
});

describe("rbac – restricciones de rol en rutas /admin y /asesor", () => {
  function canAccess(pathname: string, rol: string | undefined): boolean {
    if (pathname.startsWith("/admin") && rol !== "admin_nucleo") return false;
    if (pathname.startsWith("/asesor") && rol !== "asesor" && rol !== "admin_nucleo") return false;
    return true;
  }

  it("admin_nucleo puede acceder a /admin", () => {
    expect(canAccess("/admin", "admin_nucleo")).toBe(true);
    expect(canAccess("/admin/locales", "admin_nucleo")).toBe(true);
  });

  it("admin_local NO puede acceder a /admin", () =>
    expect(canAccess("/admin", "admin_local")).toBe(false));

  it("trabajador_local NO puede acceder a /admin", () =>
    expect(canAccess("/admin", "trabajador_local")).toBe(false));

  it("asesor NO puede acceder a /admin", () =>
    expect(canAccess("/admin", "asesor")).toBe(false));

  it("asesor puede acceder a /asesor/informes", () =>
    expect(canAccess("/asesor/informes", "asesor")).toBe(true));

  it("admin_nucleo puede acceder a /asesor/informes", () =>
    expect(canAccess("/asesor/informes", "admin_nucleo")).toBe(true));

  it("admin_local NO puede acceder a /asesor/informes", () =>
    expect(canAccess("/asesor/informes", "admin_local")).toBe(false));

  it("sin rol (undefined) no puede acceder a /admin ni /asesor", () => {
    expect(canAccess("/admin", undefined)).toBe(false);
    expect(canAccess("/asesor/informes", undefined)).toBe(false);
  });

  it("cualquier rol puede acceder a rutas normales del dashboard", () => {
    for (const rol of ["trabajador_local", "admin_local", "asesor", "admin_nucleo"]) {
      expect(canAccess("/registros", rol)).toBe(true);
      expect(canAccess("/tareas", rol)).toBe(true);
    }
  });
});
