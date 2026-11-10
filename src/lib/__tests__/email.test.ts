import { describe, expect, it } from "vitest";
import { esMismoEmail, normalizarEmail } from "@/lib/auth/email";

describe("normalizarEmail", () => {
  it("deja un solo correo canónico", () => {
    expect(normalizarEmail("  Pilar.SalasV@Gmail.COM ")).toBe("pilar.salasv@gmail.com");
  });

  it("trata mayúsculas como el mismo correo", () => {
    expect(esMismoEmail("CeciliaSanchez87@gmail.com", "ceciliasanchez87@gmail.com")).toBe(true);
    expect(esMismoEmail("a@b.cl", "otro@b.cl")).toBe(false);
  });
});
