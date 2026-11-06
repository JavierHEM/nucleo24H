import { describe, expect, it } from "vitest";
import { hallazgoBloqueaSello, transicionHallazgo } from "@/lib/hallazgos/ciclo";
import { codigoHallazgo, coincideCodigoHallazgo, hallazgoPorCodigo } from "@/lib/hallazgos/codigo";

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

describe("codigoHallazgo", () => {
  const id = "a8f04228-4c11-4b2a-9d33-0e1f2a3b4c5d";

  it("usa H- y los primeros 8 hex", () => {
    expect(codigoHallazgo(id)).toBe("H-A8F04228");
  });

  it("acepta código corto, con o sin guion, y el UUID completo", () => {
    expect(coincideCodigoHallazgo(id, "H-A8F04228")).toBe(true);
    expect(coincideCodigoHallazgo(id, "h a8f04228")).toBe(true);
    expect(coincideCodigoHallazgo(id, "A8F04228")).toBe(true);
    expect(coincideCodigoHallazgo(id, id)).toBe(true);
    expect(coincideCodigoHallazgo(id, "H-00000000")).toBe(false);
  });

  it("resuelve un hallazgo de la lista del local", () => {
    const items = [{ id }, { id: "11111111-1111-4111-8111-111111111111" }];
    expect(hallazgoPorCodigo(items, "H-A8F04228")).toEqual([{ id }]);
    expect(hallazgoPorCodigo(items, "H-99999999")).toEqual([]);
  });
});
