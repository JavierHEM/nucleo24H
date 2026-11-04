import { describe, expect, it } from "vitest";
import { rutaTrasCambioDeLocal } from "../locales/cambiarLocal";
import { agruparLocalesParaSelector, coincidenConBusqueda } from "../locales/selector";

const LOCALES = [
  { id: "1", nombre: "Los Alerces Casa Central", rut: "76.111.111-1", created_at: "2026-01-01" },
  { id: "2", nombre: "Los Alerces Puerto Varas", rut: "76.111.111-1", created_at: "2026-02-01" },
  { id: "3", nombre: "Café del Sur", rut: "77.222.222-2", created_at: "2026-03-01" },
];

describe("rutaTrasCambioDeLocal", () => {
  it("sale del detalle y queda en la sección", () => {
    expect(rutaTrasCambioDeLocal("/hallazgos/a8f04228-e450-40af-984e-cd27cab9cde0")).toBe("/hallazgos");
    expect(rutaTrasCambioDeLocal("/proveedores/a8f04228-e450-40af-984e-cd27cab9cde0")).toBe("/proveedores");
  });

  it("conserva listados y el home", () => {
    expect(rutaTrasCambioDeLocal("/registros")).toBe("/registros");
    expect(rutaTrasCambioDeLocal("/")).toBe("/");
  });
});

describe("buscador de locales", () => {
  it("filtra por nombre y por RUT", () => {
    expect(coincidenConBusqueda(LOCALES, "puerto")).toHaveLength(1);
    expect(coincidenConBusqueda(LOCALES, "76111111")).toHaveLength(2);
    expect(coincidenConBusqueda(LOCALES, "café")).toHaveLength(1);
  });

  it("agrupa por empresa los resultados", () => {
    const grupos = agruparLocalesParaSelector(LOCALES, "alerces");
    expect(grupos).toHaveLength(1);
    expect(grupos[0].sucursales).toHaveLength(1);
  });
});
