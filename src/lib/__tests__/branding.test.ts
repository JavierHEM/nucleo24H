import { afterEach, describe, expect, it, vi } from "vitest";
import { PRODUCTION_URL, esUrlPublicaDeLaApp, getAppUrl } from "@/lib/branding";

describe("esUrlPublicaDeLaApp", () => {
  it("acepta el dominio de producción", () => {
    expect(esUrlPublicaDeLaApp("https://nucleo24h.cl")).toBe(true);
    expect(esUrlPublicaDeLaApp("https://www.nucleo24h.cl")).toBe(true);
  });

  it("rechaza deploys de Vercel (piden login SSO)", () => {
    expect(esUrlPublicaDeLaApp("https://nucleo-javiers-projects-701ba2d1.vercel.app")).toBe(false);
    expect(esUrlPublicaDeLaApp("https://nucleo-mu.vercel.app")).toBe(false);
  });

  it("rechaza basura", () => {
    expect(esUrlPublicaDeLaApp("")).toBe(false);
    expect(esUrlPublicaDeLaApp("nucleo24h.cl")).toBe(false);
  });
});

describe("getAppUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ignora NEXT_PUBLIC_APP_URL si es un *.vercel.app", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://nucleo-javiers-projects-701ba2d1.vercel.app");
    vi.stubEnv("NODE_ENV", "production");
    expect(getAppUrl()).toBe(PRODUCTION_URL);
  });

  it("usa el dominio configurado cuando es público", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://nucleo24h.cl/");
    expect(getAppUrl()).toBe("https://nucleo24h.cl");
  });
});
