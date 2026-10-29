import { describe, it, expect } from "vitest";
import { agruparPorPlan } from "@/lib/adminPlanes";
import { PLAN_PRECIOS_CLP } from "@/lib/planes";

describe("agruparPorPlan", () => {
  it("suma locales e ingreso mensual por plan", () => {
    const resumen = agruparPorPlan([
      { plan: "calidad", monto: 70_000 },
      { plan: "calidad", monto: null },
      { plan: "integral", monto: 150_000 },
    ]);
    expect(resumen.calidad).toEqual({ locales: 2, ingresoMensual: 70_000 + PLAN_PRECIOS_CLP.calidad });
    expect(resumen.integral).toEqual({ locales: 1, ingresoMensual: 150_000 });
  });

  it("un plan desconocido cuenta como Calidad", () => {
    expect(agruparPorPlan([{ plan: "otro", monto: undefined }]).calidad.locales).toBe(1);
  });

  it("sin locales devuelve ceros", () => {
    expect(agruparPorPlan([]).integral).toEqual({ locales: 0, ingresoMensual: 0 });
  });
});
