import { describe, expect, it } from "vitest";
import { destinoTrasOnboarding, enlaceDeAcceso, nextSeguro, redirectInvitacion } from "@/lib/auth/enlaceInvitacion";

describe("enlace de invitación", () => {
  it("apunta al callback con el token, no al verificador de Supabase", () => {
    const link = enlaceDeAcceso(
      "https://nucleo-mu.vercel.app",
      { hashed_token: "abc", verification_type: "invite" },
      "/admin"
    );
    expect(link).toBe(
      "https://nucleo-mu.vercel.app/api/auth/callback?token_hash=abc&type=invite&next=%2Fadmin"
    );
  });

  it("rechaza un next que salga del sitio", () => {
    expect(nextSeguro("https://otro.cl")).toBe("/");
    expect(nextSeguro("//otro.cl")).toBe("/");
    expect(enlaceDeAcceso("https://nucleo-mu.vercel.app", { hashed_token: "abc" }, "https://otro.cl")).toContain(
      "next=%2F"
    );
  });

  it("el redirectTo de generateLink apunta al callback de la app", () => {
    expect(redirectInvitacion("https://nucleo24h.cl")).toBe("https://nucleo24h.cl/api/auth/callback");
  });

  it("no deja a Núcleo en /onboarding después de crear la clave", () => {
    expect(destinoTrasOnboarding("/onboarding", "admin_nucleo")).toBe("/admin");
    expect(destinoTrasOnboarding("/onboarding", "asesor")).toBe("/asesor/informes");
    expect(destinoTrasOnboarding("/onboarding", "admin_local")).toBe("/");
    expect(destinoTrasOnboarding("/registros", "admin_local")).toBe("/registros");
  });
});
