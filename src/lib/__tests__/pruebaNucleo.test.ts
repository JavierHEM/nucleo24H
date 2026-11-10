import { describe, expect, it } from "vitest";
import { MONTO_PRUEBA_MP_NUCLEO_CLP, montoMercadoPagoParaRol, pruebaMpNucleoActiva } from "@/lib/payments/pruebaNucleo";

describe("cargo de prueba Mercado Pago para Núcleo", () => {
  it("cobra 100 CLP solo a admin_nucleo mientras la prueba está activa", () => {
    expect(pruebaMpNucleoActiva()).toBe(true);
    expect(MONTO_PRUEBA_MP_NUCLEO_CLP).toBe(100);
    expect(montoMercadoPagoParaRol("admin_nucleo", 95_200)).toBe(100);
  });

  it("deja el monto de catálogo para el dueño del local", () => {
    expect(montoMercadoPagoParaRol("admin_local", 95_200)).toBe(95_200);
    expect(montoMercadoPagoParaRol("jefe_local", 119_000)).toBe(119_000);
    expect(montoMercadoPagoParaRol(null, 95_200)).toBe(95_200);
  });
});
