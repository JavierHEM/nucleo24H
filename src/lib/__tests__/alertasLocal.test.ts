import { describe, it, expect } from "vitest";
import { armarAlertasLocal, type DatosAlertasLocal } from "@/lib/alertasLocal";

const ahora = new Date(2026, 5, 10);

const base: DatosAlertasLocal = {
  ahora,
  documentos: [],
  noConformidades: [],
  pago: null,
  contratoHasta: null,
  vencimientosAmbientales: null,
};

const ids = (datos: Partial<DatosAlertasLocal>) => armarAlertasLocal({ ...base, ...datos }).map((a) => a.id);

describe("alertas del local", () => {
  it("sin datos no hay alertas", () => {
    expect(ids({})).toEqual([]);
  });

  it("distingue documentos vencidos, por vencer y observados", () => {
    const resultado = ids({
      documentos: [
        { estado: "aprobado", vencimiento: new Date(2026, 5, 1) },
        { estado: "aprobado", vencimiento: new Date(2026, 5, 20) },
        { estado: "observado", vencimiento: null },
      ],
    });
    expect(resultado).toEqual(expect.arrayContaining(["docs-vencidos", "docs-por-vencer", "docs-observados"]));
  });

  it("ignora no conformidades cerradas", () => {
    expect(ids({ noConformidades: [{ estado: "cerrada", fecha_limite: new Date(2026, 5, 1) }] })).toEqual([]);
    expect(ids({ noConformidades: [{ estado: "abierta", fecha_limite: new Date(2026, 5, 1) }] })).toEqual(["nc-vencidas"]);
  });

  it("avisa el pago pendiente según el día de cobro", () => {
    const antes = armarAlertasLocal({ ...base, pago: { suscripcionEstado: "activa", pagadoEnPeriodo: false, diaCobro: 20 } });
    const despues = armarAlertasLocal({ ...base, pago: { suscripcionEstado: "activa", pagadoEnPeriodo: false, diaCobro: 5 } });
    expect(antes[0].tipo).toBe("proximo");
    expect(despues[0].tipo).toBe("vencido");
    expect(armarAlertasLocal({ ...base, pago: { suscripcionEstado: "activa", pagadoEnPeriodo: true, diaCobro: 5 } })).toEqual([]);
  });

  it("avisa la renovación del contrato dentro de 60 días", () => {
    expect(ids({ contratoHasta: new Date(2026, 6, 20) })).toEqual(["contrato-por-vencer"]);
    expect(ids({ contratoHasta: new Date(2026, 11, 20) })).toEqual([]);
    expect(ids({ contratoHasta: new Date(2026, 4, 20) })).toEqual(["contrato-vencido"]);
  });

  it("solo evalúa lo ambiental cuando el plan lo incluye", () => {
    expect(ids({ vencimientosAmbientales: null })).toEqual([]);
    expect(ids({ vencimientosAmbientales: [{ vence: new Date(2026, 5, 20) }] })).toEqual(["ambiental-proximos"]);
  });

  it("ordena primero lo vencido", () => {
    const resultado = armarAlertasLocal({
      ...base,
      documentos: [
        { estado: "aprobado", vencimiento: new Date(2026, 5, 20) },
        { estado: "aprobado", vencimiento: new Date(2026, 5, 1) },
      ],
    });
    expect(resultado[0].tipo).toBe("vencido");
  });
});
