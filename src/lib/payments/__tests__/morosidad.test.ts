/**
 * Tests para la lógica de morosidad de suscripciones.
 *
 * Usando fechas en UTC con hora al mediodía para evitar problemas
 * de timezone entre el servidor de tests y la zona de Santiago.
 */
import { describe, it, expect } from "vitest";

/**
 * Determina si un pago está atrasado según el día de cobro.
 * Usa UTC puro para ser independiente de la timezone del host.
 */
function esMorosa(
  estado: string,
  diaCobro: number,
  hoy: Date,
  ultimoPagoPeriodo: string | null
): boolean {
  if (estado !== "activa") return false;

  const year = hoy.getUTCFullYear();
  const month = hoy.getUTCMonth() + 1;
  const day = hoy.getUTCDate();

  const periodoActual = `${year}-${String(month).padStart(2, "0")}`;
  const yaPago = ultimoPagoPeriodo === periodoActual;
  if (yaPago) return false;

  return day > diaCobro;
}

/** Helper para crear fechas UTC sin ambigüedad de timezone */
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

describe("esMorosa – lógica de marcado de morosidad", () => {
  it("activa sin pago y pasado el día de cobro → morosa", () => {
    const hoy = utcDate(2026, 6, 10); // día 10
    expect(esMorosa("activa", 5, hoy, null)).toBe(true);
  });

  it("activa sin pago pero antes del día de cobro → no morosa", () => {
    const hoy = utcDate(2026, 6, 3); // día 3, cobro el 5
    expect(esMorosa("activa", 5, hoy, null)).toBe(false);
  });

  it("activa con pago del período actual → no morosa", () => {
    const hoy = utcDate(2026, 6, 15);
    expect(esMorosa("activa", 5, hoy, "2026-06")).toBe(false);
  });

  it("activa con pago del mes anterior → morosa (pasado día de cobro)", () => {
    const hoy = utcDate(2026, 6, 10);
    expect(esMorosa("activa", 5, hoy, "2026-05")).toBe(true);
  });

  it("suspendida no se marca morosa", () => {
    const hoy = utcDate(2026, 6, 15);
    expect(esMorosa("suspendida", 5, hoy, null)).toBe(false);
  });

  it("cancelada no se marca morosa", () => {
    const hoy = utcDate(2026, 6, 15);
    expect(esMorosa("cancelada", 5, hoy, null)).toBe(false);
  });

  it("ya morosa no se vuelve a marcar (estado no activa)", () => {
    const hoy = utcDate(2026, 6, 15);
    expect(esMorosa("morosa", 5, hoy, null)).toBe(false);
  });

  it("exactamente en el día de cobro no es morosa (> no >=)", () => {
    const hoy = utcDate(2026, 6, 5);
    expect(esMorosa("activa", 5, hoy, null)).toBe(false);
  });

  it("un día después del cobro → morosa", () => {
    const hoy = utcDate(2026, 6, 6); // día 6 UTC
    expect(esMorosa("activa", 5, hoy, null)).toBe(true);
  });

  it("último día del mes con cobro en día 28 → morosa", () => {
    const hoy = utcDate(2026, 2, 28); // 28 feb
    expect(esMorosa("activa", 25, hoy, null)).toBe(true);
  });
});

describe("estados de suscripción – transiciones válidas", () => {
  type EstadoSuscripcion = "activa" | "morosa" | "suspendida" | "cancelada";

  function transicionValida(desde: EstadoSuscripcion, hacia: EstadoSuscripcion): boolean {
    const TRANSICIONES: Record<EstadoSuscripcion, EstadoSuscripcion[]> = {
      activa: ["morosa", "cancelada"],
      morosa: ["activa", "suspendida", "cancelada"],
      suspendida: ["activa", "cancelada"],
      cancelada: [],
    };
    return TRANSICIONES[desde].includes(hacia);
  }

  it("activa puede pasar a morosa", () =>
    expect(transicionValida("activa", "morosa")).toBe(true));

  it("morosa puede volver a activa (pago recibido)", () =>
    expect(transicionValida("morosa", "activa")).toBe(true));

  it("morosa puede pasar a suspendida", () =>
    expect(transicionValida("morosa", "suspendida")).toBe(true));

  it("activa puede cancelarse directamente", () =>
    expect(transicionValida("activa", "cancelada")).toBe(true));

  it("cancelada no puede reactivarse (estado terminal)", () => {
    expect(transicionValida("cancelada", "activa")).toBe(false);
    expect(transicionValida("cancelada", "morosa")).toBe(false);
    expect(transicionValida("cancelada", "suspendida")).toBe(false);
  });

  it("activa NO puede pasar directamente a suspendida", () =>
    expect(transicionValida("activa", "suspendida")).toBe(false));

  it("suspendida puede reactivarse", () =>
    expect(transicionValida("suspendida", "activa")).toBe(true));
});
