import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { leerCookieTenantActivo } from "../tenantCookie";

const TENANT = "a8f04228-e450-40af-984e-cd27cab9cde0";

describe("leerCookieTenantActivo", () => {
  it("lee tenant_activo del Request (ruta /api/trpc)", async () => {
    const req = new NextRequest("http://local.test/api/trpc", {
      headers: { cookie: `tenant_activo=${TENANT}; other=1` },
    });
    expect(await leerCookieTenantActivo(req)).toBe(TENANT);
  });

  it("sin cookie no inventa un local", async () => {
    const req = new NextRequest("http://local.test/api/trpc");
    expect(await leerCookieTenantActivo(req)).toBeUndefined();
  });
});
