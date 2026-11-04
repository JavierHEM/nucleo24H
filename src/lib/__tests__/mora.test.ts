import { describe, expect, it } from "vitest";
import {
  DIA_SOLO_LECTURA,
  DIAS_GRACIA_CORRIDO,
  estadoTrasImpago,
  selloPublicoVisible,
  suscripcionEscribible,
} from "@/lib/payments/mora";

describe("estadoTrasImpago", () => {
  it("el documento fija 10 días corridos de gracia y solo lectura al sexto día", () => {
    expect(DIAS_GRACIA_CORRIDO).toBe(10);
    expect(DIA_SOLO_LECTURA).toBe(6);
  });

  it("días 1–5 deja morosa con acceso", () => {
    expect(
      estadoTrasImpago({
        estadoActual: "activa",
        diaCobro: 5,
        pagadoEstePeriodo: false,
        ahora: new Date(2026, 10, 8),
      })
    ).toBe("morosa");
  });

  it("día 6 pasa a suspendida", () => {
    expect(
      estadoTrasImpago({
        estadoActual: "morosa",
        diaCobro: 5,
        pagadoEstePeriodo: false,
        ahora: new Date(2026, 10, 11),
      })
    ).toBe("suspendida");
  });
});

describe("suscripcionEscribible", () => {
  it("suspendida es solo lectura", () => {
    expect(suscripcionEscribible({ estado: "suspendida" })).toBe(false);
    expect(suscripcionEscribible({ estado: "morosa" })).toBe(true);
    expect(suscripcionEscribible({ estado: "activa" })).toBe(true);
  });

  it("cancelada escribe solo hasta acceso_hasta", () => {
    expect(
      suscripcionEscribible({
        estado: "cancelada",
        accesoHasta: new Date(2026, 10, 30),
        ahora: new Date(2026, 10, 10),
      })
    ).toBe(true);
    expect(
      suscripcionEscribible({
        estado: "cancelada",
        accesoHasta: new Date(2026, 9, 31),
        ahora: new Date(2026, 10, 10),
      })
    ).toBe(false);
  });
});

describe("selloPublicoVisible", () => {
  it("se oculta si está suspendida", () => {
    expect(selloPublicoVisible({ estado: "suspendida" })).toBe(false);
    expect(selloPublicoVisible({ estado: "activa" })).toBe(true);
  });
});
