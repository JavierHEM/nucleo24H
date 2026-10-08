import { describe, expect, it } from "vitest";
import { agruparPorEmpresa, claveRut } from "@/lib/empresas";

describe("agruparPorEmpresa", () => {
  it("normaliza el RUT ignorando puntos y espacios", () => {
    expect(claveRut("22.222.222-2")).toBe(claveRut("22222222-2"));
  });

  it("toma como casa central el local más antiguo del mismo RUT", () => {
    const grupos = agruparPorEmpresa([
      {
        id: "b",
        nombre: "Local Principal",
        rut: "22.222.222-2",
        created_at: "2026-09-24T22:51:29.333Z",
      },
      {
        id: "a",
        nombre: "Restaurant El Loco",
        rut: "22222222-2",
        created_at: "2026-09-24T22:50:54.801Z",
      },
      {
        id: "c",
        nombre: "Local de Prueba",
        rut: "77.777.777-7",
        created_at: "2026-06-09T20:07:11.833Z",
      },
    ]);

    expect(grupos).toHaveLength(2);
    const loco = grupos.find((g) => claveRut(g.rut) === "22222222-2");
    expect(loco?.casaCentral.nombre).toBe("Restaurant El Loco");
    expect(loco?.sucursales.map((s) => s.nombre)).toEqual(["Local Principal"]);
    expect(grupos[0].casaCentral.nombre).toBe("Local de Prueba");
    expect(grupos[0].sucursales).toHaveLength(0);
  });
});
