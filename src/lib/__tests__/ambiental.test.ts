import { describe, it, expect } from "vitest";
import { contarDeclaraciones, declaracionesRestantes, registroAmbientalSchema, vencimientosProximos } from "@/lib/ambiental";
import { cicloContrato, DECLARACIONES_VU_ANUALES } from "@/lib/planes";

const ciclo = cicloContrato(new Date(2026, 2, 1), new Date(2026, 8, 1));

describe("contador de declaraciones de Ventanilla Única", () => {
  it("cuenta solo declaraciones del año de contrato vigente", () => {
    const registros = [
      { tipo: "ventanilla_unica", fecha: new Date(2026, 2, 1) },
      { tipo: "ventanilla_unica", fecha: new Date(2026, 7, 15) },
      { tipo: "ventanilla_unica", fecha: new Date(2026, 1, 28) },
      { tipo: "ventanilla_unica", fecha: new Date(2027, 2, 1) },
      { tipo: "charla", fecha: new Date(2026, 5, 1) },
    ];
    expect(contarDeclaraciones(registros, ciclo)).toBe(2);
  });

  it("calcula las declaraciones restantes sin bajar de cero", () => {
    expect(declaracionesRestantes(5)).toBe(DECLARACIONES_VU_ANUALES - 5);
    expect(declaracionesRestantes(DECLARACIONES_VU_ANUALES + 3)).toBe(0);
  });
});

describe("vencimientos ambientales", () => {
  it("devuelve los próximos y vencidos ordenados por fecha", () => {
    const ahora = new Date(2026, 5, 1);
    const registros = [
      { tipo: "asesoria", fecha: ahora, vence: new Date(2026, 6, 10) },
      { tipo: "asesoria", fecha: ahora, vence: new Date(2026, 5, 10) },
      { tipo: "asesoria", fecha: ahora, vence: new Date(2027, 5, 10) },
      { tipo: "charla", fecha: ahora, vence: null },
    ];
    const resultado = vencimientosProximos(registros, ahora, 60);
    expect(resultado.map((r) => r.vence)).toEqual([new Date(2026, 5, 10), new Date(2026, 6, 10)]);
  });
});

describe("registroAmbientalSchema", () => {
  it("rechaza tipos que no existen y detalles vacíos", () => {
    const base = { fecha: new Date().toISOString(), detalle: "Declaración mensual" };
    expect(registroAmbientalSchema.safeParse({ ...base, tipo: "certificado" }).success).toBe(false);
    expect(registroAmbientalSchema.safeParse({ ...base, tipo: "charla", detalle: " " }).success).toBe(false);
    expect(registroAmbientalSchema.safeParse({ ...base, tipo: "charla" }).success).toBe(true);
  });
});
