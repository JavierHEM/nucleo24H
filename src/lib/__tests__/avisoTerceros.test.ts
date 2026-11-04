import { describe, expect, it } from "vitest";
import { AVISO_EVIDENCIA_TERCEROS } from "../declaraciones/textos";

describe("AVISO_EVIDENCIA_TERCEROS", () => {
  it("advierte autorización, datos personales y la ley aplicable", () => {
    expect(AVISO_EVIDENCIA_TERCEROS.titulo).toMatch(/terceros/i);
    expect(AVISO_EVIDENCIA_TERCEROS.texto).toMatch(/autorización/i);
    expect(AVISO_EVIDENCIA_TERCEROS.texto).toMatch(/datos personales/i);
    expect(AVISO_EVIDENCIA_TERCEROS.texto).toContain("Ley 21.719");
    expect(AVISO_EVIDENCIA_TERCEROS.texto).toContain("tienes");
    expect(AVISO_EVIDENCIA_TERCEROS.texto).not.toMatch(/tenés|confirmá|subás/);
  });
});
