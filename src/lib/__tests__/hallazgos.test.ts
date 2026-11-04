import { describe, expect, it } from "vitest";
import { hallazgoBloqueaSello, transicionHallazgo } from "@/lib/hallazgos/ciclo";

describe("hallazgoBloqueaSello", () => {
  it("bloquea solo críticos no cerrados", () => {
    expect(hallazgoBloqueaSello("critico", "abierto")).toBe(true);
    expect(hallazgoBloqueaSello("critico", "evidencia_en_revision")).toBe(true);
    expect(hallazgoBloqueaSello("critico", "cerrado_validado")).toBe(false);
    expect(hallazgoBloqueaSello("critico", "seguimiento_eficacia")).toBe(false);
    expect(hallazgoBloqueaSello("mayor", "abierto")).toBe(false);
  });
});

describe("transicionHallazgo", () => {
  it("el local no cierra validado", () => {
    expect(transicionHallazgo("evidencia_en_revision", "cerrado_validado", "admin_local")).toBe(false);
    expect(transicionHallazgo("evidencia_en_revision", "cerrado_validado", "asesor")).toBe(true);
  });

  it("no se salta el ciclo", () => {
    expect(transicionHallazgo("abierto", "evidencia_en_revision", "admin_local")).toBe(false);
    expect(transicionHallazgo("abierto", "medida_inmediata", "admin_local")).toBe(true);
    expect(transicionHallazgo("abierto", "cerrado_validado", "asesor")).toBe(false);
  });
});
