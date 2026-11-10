import { describe, expect, it } from "vitest";
import { altaSuscripcionLocal } from "@/lib/locales/altaSuscripcion";
import { etiquetaSitioEmpresa, resumenLocalesEmpresa } from "@/lib/locales/etiquetasEmpresa";
import { PLAN_PRECIOS_CLP } from "@/lib/planes";

describe("etiquetas de empresa", () => {
  it("un solo local es casa matriz", () => {
    expect(etiquetaSitioEmpresa({ tieneSucursales: false, esCasaMatriz: true })).toBe("Casa matriz");
    expect(resumenLocalesEmpresa(1)).toBe("1 local · casa matriz");
  });

  it("con sucursales distingue casa matriz y sucursal", () => {
    expect(etiquetaSitioEmpresa({ tieneSucursales: true, esCasaMatriz: true })).toBe("Casa matriz");
    expect(etiquetaSitioEmpresa({ tieneSucursales: true, esCasaMatriz: false })).toBe("Sucursal");
    expect(resumenLocalesEmpresa(3)).toBe("3 locales · 2 sucursales");
  });
});

describe("alta de suscripción por local", () => {
  it("cada local nuevo cobra su propio plan", () => {
    const ahora = new Date("2026-11-09T12:00:00-03:00");
    const alta = altaSuscripcionLocal({ plan: "calidad", diaCobro: 5, ahora });
    expect(alta.monto_clp).toBe(PLAN_PRECIOS_CLP.calidad);
    expect(alta.estado).toBe("activa");
    expect(alta.hasta.getFullYear()).toBe(2027);
  });
});
