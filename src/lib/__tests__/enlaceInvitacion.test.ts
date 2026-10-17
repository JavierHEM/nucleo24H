import { describe, expect, it } from "vitest";
import { enlaceDeAcceso, nextSeguro } from "@/lib/auth/enlaceInvitacion";

describe("enlace de invitación", () => {
  it("apunta al callback con el token, no al verificador de Supabase", () => {
    const link = enlaceDeAcceso(
      "https://nucleo-mu.vercel.app",
      { hashed_token: "abc", verification_type: "invite" },
      "/onboarding"
    );
    expect(link).toBe(
      "https://nucleo-mu.vercel.app/api/auth/callback?token_hash=abc&type=invite&next=%2Fonboarding"
    );
  });

  it("rechaza un next que salga del sitio", () => {
    expect(nextSeguro("https://otro.cl")).toBe("/");
    expect(nextSeguro("//otro.cl")).toBe("/");
    expect(enlaceDeAcceso("https://nucleo-mu.vercel.app", { hashed_token: "abc" }, "https://otro.cl")).toContain(
      "next=%2F"
    );
  });
});
