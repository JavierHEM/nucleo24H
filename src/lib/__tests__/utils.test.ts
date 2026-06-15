import { describe, it, expect } from "vitest";
import { formatCLP, formatDate, formatPeriodo, getCurrentPeriodo, cn } from "../utils";

describe("formatCLP", () => {
  it("retorna un string no vacío para montos positivos", () => {
    expect(formatCLP(80000)).toBeTruthy();
    expect(typeof formatCLP(80000)).toBe("string");
  });

  it("formatea cero correctamente", () => {
    const result = formatCLP(0);
    expect(result).toContain("0");
  });

  it("el monto 80.000 contiene la cifra 80", () => {
    expect(formatCLP(80000)).toContain("80");
  });

  it("el monto 150.000 contiene la cifra 150", () => {
    expect(formatCLP(150000)).toContain("150");
  });

  it("los planes calidad e integral dan resultados distintos", () => {
    expect(formatCLP(80_000)).not.toBe(formatCLP(150_000));
  });

  it("el formato tiene el símbolo de moneda CLP o $", () => {
    const result = formatCLP(50000);
    // Intl puede usar $ o CLP dependiendo del entorno
    const hasCurrencySymbol = result.includes("$") || result.includes("CLP") || result.includes("clp");
    expect(hasCurrencySymbol).toBe(true);
  });
});

describe("formatDate", () => {
  it("retorna un string de fecha para un objeto Date", () => {
    const result = formatDate(new Date("2026-01-15T12:00:00Z"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(4);
  });

  it("acepta strings ISO", () => {
    const result = formatDate("2025-06-15T00:00:00.000Z");
    expect(typeof result).toBe("string");
    expect(result).toMatch(/2025/);
  });

  it("incluye el año 2026", () => {
    const result = formatDate(new Date("2026-03-20T12:00:00Z"));
    expect(result).toMatch(/2026/);
  });

  it("la representación contiene el día (15)", () => {
    // ISO string dates at noon UTC are safe from timezone shifts
    const result = formatDate(new Date("2026-06-15T12:00:00Z"));
    expect(result).toMatch(/15/);
  });

  it("la representación contiene el mes (06 o 6)", () => {
    const result = formatDate(new Date("2026-06-15T12:00:00Z"));
    expect(result).toMatch(/0?6/);
  });
});

describe("formatPeriodo", () => {
  it("formatea 2026-01 como enero de 2026", () => {
    const result = formatPeriodo("2026-01");
    expect(result.toLowerCase()).toContain("enero");
    expect(result).toContain("2026");
  });

  it("formatea 2026-12 como diciembre de 2026", () => {
    const result = formatPeriodo("2026-12");
    expect(result.toLowerCase()).toContain("diciembre");
    expect(result).toContain("2026");
  });

  it("formatea 2026-06 como junio de 2026", () => {
    const result = formatPeriodo("2026-06");
    expect(result.toLowerCase()).toContain("junio");
  });

  it("retorna un string no vacío para cualquier mes válido", () => {
    for (let m = 1; m <= 12; m++) {
      const periodo = `2025-${String(m).padStart(2, "0")}`;
      expect(formatPeriodo(periodo).length).toBeGreaterThan(5);
    }
  });

  it("periodos distintos producen textos distintos", () => {
    expect(formatPeriodo("2026-01")).not.toBe(formatPeriodo("2026-02"));
  });
});

describe("getCurrentPeriodo", () => {
  it("retorna formato YYYY-MM", () => {
    const result = getCurrentPeriodo();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it("el año es >= 2026", () => {
    const result = getCurrentPeriodo();
    const year = parseInt(result.split("-")[0]);
    expect(year).toBeGreaterThanOrEqual(2026);
  });

  it("el mes está entre 01 y 12", () => {
    const result = getCurrentPeriodo();
    const month = parseInt(result.split("-")[1]);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it("el resultado tiene exactamente 7 caracteres (YYYY-MM)", () => {
    expect(getCurrentPeriodo()).toHaveLength(7);
  });
});

describe("cn (tailwind class merger)", () => {
  it("combina clases simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("elimina clases condicionales falsas", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("resuelve conflictos de Tailwind (last wins)", () => {
    const result = cn("text-sm", "text-lg");
    expect(result).toBe("text-lg");
  });

  it("ignora valores undefined y null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("retorna string vacío sin argumentos", () => {
    expect(cn()).toBe("");
  });
});
