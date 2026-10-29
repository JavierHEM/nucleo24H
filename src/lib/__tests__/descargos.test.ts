import { describe, it, expect } from "vitest";
import { elegibilidadDescargo, solicitudDescargoSchema, transicionDescargoValida } from "@/lib/descargos";

describe("elegibilidad de descargos", () => {
  it("se habilitan solo con el último sello Premium", () => {
    const resultado = elegibilidadDescargo({ nivel: "premium", score_general: 93, periodo: "2026-09" }, 90);
    expect(resultado.habilitado).toBe(true);
    expect(resultado.motivo).toBeNull();
  });

  it("sin sello emitido explica el motivo", () => {
    const resultado = elegibilidadDescargo(null, 90);
    expect(resultado.habilitado).toBe(false);
    expect(resultado.motivo).toContain("Premium");
  });

  it("un sello avanzado informa cuántos puntos faltan", () => {
    const resultado = elegibilidadDescargo({ nivel: "avanzado", score_general: 84.2, periodo: "2026-09" }, 90);
    expect(resultado.habilitado).toBe(false);
    expect(resultado.puntosFaltantes).toBe(6);
    expect(resultado.motivo).toContain("Faltan 6 puntos");
  });

  it("nunca informa cero puntos faltantes si no es Premium", () => {
    const resultado = elegibilidadDescargo({ nivel: "avanzado", score_general: 90, periodo: "2026-09" }, 90);
    expect(resultado.puntosFaltantes).toBe(1);
  });
});

describe("estados del descargo", () => {
  it("solo avanza en el orden definido", () => {
    expect(transicionDescargoValida("abierto", "en_revision")).toBe(true);
    expect(transicionDescargoValida("abierto", "cerrado")).toBe(true);
    expect(transicionDescargoValida("presentado", "en_revision")).toBe(false);
    expect(transicionDescargoValida("cerrado", "cerrado")).toBe(false);
  });
});

describe("solicitudDescargoSchema", () => {
  it("limita los adjuntos a cinco", () => {
    const base = { titulo: "Acta 123", descripcion: "Descripción suficiente del caso" };
    expect(solicitudDescargoSchema.safeParse({ ...base, adjuntos: Array(5).fill("documentos/x/a.pdf") }).success).toBe(true);
    expect(solicitudDescargoSchema.safeParse({ ...base, adjuntos: Array(6).fill("documentos/x/a.pdf") }).success).toBe(false);
  });
});
