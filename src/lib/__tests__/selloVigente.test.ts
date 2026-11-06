import { describe, expect, it } from "vitest";
import { selloEsDelPeriodoEnCurso, selloVigente } from "@/lib/sellos/vigente";

describe("selloVigente", () => {
  it("elige el último emitido y ignora el mes en curso si aún no se entrega", () => {
    expect(
      selloVigente([
        { periodo: "2026-11", estado: "propuesto" },
        { periodo: "2026-10", estado: "emitido" },
        { periodo: "2026-09", estado: "emitido" },
      ])?.periodo
    ).toBe("2026-10");
  });

  it("sin emisión previa no hay sello vigente", () => {
    expect(selloVigente([{ periodo: "2026-11", estado: "propuesto" }])).toBeNull();
    expect(selloVigente([])).toBeNull();
  });
});

describe("selloEsDelPeriodoEnCurso", () => {
  it("el vigente de octubre no cubre noviembre", () => {
    expect(selloEsDelPeriodoEnCurso("2026-10", "2026-11")).toBe(false);
    expect(selloEsDelPeriodoEnCurso("2026-11", "2026-11")).toBe(true);
  });
});
