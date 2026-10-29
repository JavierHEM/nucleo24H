import { describe, it, expect } from "vitest";
import {
  AVISO_RENOVACION_DIAS,
  CONTRATO_MESES,
  PLANES,
  PLAN_IDS,
  PLAN_PRECIOS_CLP,
  cicloContrato,
  contratoPorVencer,
  estadoContrato,
  finDeContrato,
  normalizarPlan,
  normalizarTipoLocal,
  planIncluye,
} from "@/lib/planes";

describe("catálogo de planes", () => {
  it("el precio de cada plan coincide con PLAN_PRECIOS_CLP", () => {
    for (const id of PLAN_IDS) expect(PLANES[id].precio).toBe(PLAN_PRECIOS_CLP[id]);
  });

  it("solo el Plan Integral incluye el módulo ambiental", () => {
    expect(planIncluye("integral", "ambiental")).toBe(true);
    expect(planIncluye("calidad", "ambiental")).toBe(false);
  });

  it("un plan desconocido cae en Calidad", () => {
    expect(normalizarPlan("premium")).toBe("calidad");
    expect(normalizarPlan(undefined)).toBe("calidad");
    expect(planIncluye(null, "ambiental")).toBe(false);
  });

  it("el rubro desconocido cae en restaurante", () => {
    expect(normalizarTipoLocal("food_truck")).toBe("food_truck");
    expect(normalizarTipoLocal("ferreteria")).toBe("restaurante");
  });

  it("los beneficios ambientales solo existen en el Plan Integral", () => {
    expect(PLANES.calidad.beneficios.some((b) => b.modulo)).toBe(false);
    expect(PLANES.integral.beneficios.some((b) => b.modulo === "ambiental")).toBe(true);
  });
});

describe("contrato de 12 meses", () => {
  it("finDeContrato suma CONTRATO_MESES", () => {
    const fin = finDeContrato(new Date(2026, 0, 15));
    expect(fin.getFullYear()).toBe(2026 + CONTRATO_MESES / 12);
    expect(fin.getMonth()).toBe(0);
    expect(fin.getDate()).toBe(15);
  });

  it("cicloContrato ancla el año en la fecha de inicio", () => {
    const ciclo = cicloContrato(new Date(2025, 5, 10), new Date(2026, 8, 1));
    expect(ciclo.inicio).toEqual(new Date(2026, 5, 10));
    expect(ciclo.fin).toEqual(new Date(2027, 5, 10));
  });

  it("cicloContrato sin contrato usa el año calendario", () => {
    const ciclo = cicloContrato(null, new Date(2026, 8, 1));
    expect(ciclo.inicio).toEqual(new Date(2026, 0, 1));
    expect(ciclo.fin).toEqual(new Date(2027, 0, 1));
  });

  it("estadoContrato distingue vigente, por vencer, vencido y sin definir", () => {
    const ahora = new Date(2026, 5, 1);
    expect(estadoContrato(null, ahora).estado).toBe("sin_definir");
    expect(estadoContrato(new Date(2026, 11, 1), ahora).estado).toBe("vigente");
    expect(estadoContrato(new Date(2026, 5, 20), ahora).estado).toBe("por_vencer");
    expect(estadoContrato(new Date(2026, 4, 1), ahora).estado).toBe("vencido");
  });

  it("el aviso de renovación salta exactamente a los 60 días", () => {
    const ahora = new Date(2026, 0, 1);
    const enSesenta = new Date(ahora.getTime() + AVISO_RENOVACION_DIAS * 86_400_000);
    const enSesentaYUno = new Date(enSesenta.getTime() + 86_400_000);
    expect(contratoPorVencer(enSesenta, ahora)).toBe(true);
    expect(contratoPorVencer(enSesentaYUno, ahora)).toBe(false);
  });
});
