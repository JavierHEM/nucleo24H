import { describe, it, expect } from "vitest";
import { calcularSello } from "../calcular";
import { PESOS_DEFAULT, UMBRALES_DEFAULT } from "../tipos";

const defaultInput = {
  pesos: PESOS_DEFAULT,
  umbrales: UMBRALES_DEFAULT,
};

describe("calcularSello", () => {
  // ── Niveles ─────────────────────────────────────────────────────────

  it("retorna nivel 'inicial' cuando score < 60", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 50,
      score_condiciones: 50,
      score_capacitaciones: 50,
      score_tareas: 50,
    });
    expect(result.nivel).toBe("inicial");
    expect(result.score_general).toBeLessThan(60);
  });

  it("retorna nivel 'intermedio' cuando score está entre 60 y 74", () => {
    // 60*0.30 + 70*0.25 + 65*0.25 + 60*0.20 = 18+17.5+16.25+12 = 63.75
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 60,
      score_condiciones: 70,
      score_capacitaciones: 65,
      score_tareas: 60,
    });
    expect(result.nivel).toBe("intermedio");
    expect(result.score_general).toBeGreaterThanOrEqual(60);
    expect(result.score_general).toBeLessThan(75);
  });

  it("retorna nivel 'avanzado' cuando score está entre 75 y 89", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 80,
      score_condiciones: 80,
      score_capacitaciones: 80,
      score_tareas: 80,
    });
    expect(result.nivel).toBe("avanzado");
    expect(result.score_general).toBeGreaterThanOrEqual(75);
    expect(result.score_general).toBeLessThan(90);
  });

  it("retorna nivel 'premium' cuando score >= 90", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 95,
      score_condiciones: 95,
      score_capacitaciones: 95,
      score_tareas: 95,
    });
    expect(result.nivel).toBe("premium");
    expect(result.score_general).toBeGreaterThanOrEqual(90);
  });

  // ── descargos_habilitados ────────────────────────────────────────────

  it("habilita descargos SOLO en nivel Premium", () => {
    const premium = calcularSello({
      ...defaultInput,
      score_documentacion: 95,
      score_condiciones: 95,
      score_capacitaciones: 95,
      score_tareas: 95,
    });
    expect(premium.descargos_habilitados).toBe(true);

    const avanzado = calcularSello({
      ...defaultInput,
      score_documentacion: 80,
      score_condiciones: 80,
      score_capacitaciones: 80,
      score_tareas: 80,
    });
    expect(avanzado.descargos_habilitados).toBe(false);

    const inicial = calcularSello({
      ...defaultInput,
      score_documentacion: 50,
      score_condiciones: 50,
      score_capacitaciones: 50,
      score_tareas: 50,
    });
    expect(inicial.descargos_habilitados).toBe(false);
  });

  // ── plan_mejoras ─────────────────────────────────────────────────────

  it("genera plan de mejoras cuando hay brechas en alguna dimensión", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 50, // bajo el umbral de 80
      score_condiciones: 90,
      score_capacitaciones: 90,
      score_tareas: 90,
    });
    expect(result.plan_mejoras.length).toBeGreaterThan(0);
    expect(result.plan_mejoras[0]).toMatch(/documentaci[oó]n/i);
  });

  it("genera plan vacío cuando todas las dimensiones superan el umbral mínimo", () => {
    // Scores sobre todos los thresholds (doc>=80, cond>=80, cap>=75, tar>=70)
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 95,
      score_condiciones: 95,
      score_capacitaciones: 95,
      score_tareas: 95,
    });
    // Premium — no hay brechas
    expect(result.plan_mejoras.length).toBe(0);
  });

  it("incluye mensaje motivacional cuando está cerca del nivel Premium", () => {
    // avanzado, score entre 75-89
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 85,
      score_condiciones: 85,
      score_capacitaciones: 85,
      score_tareas: 85,
    });
    expect(result.nivel).toBe("avanzado");
    const motivacional = result.plan_mejoras.find((m) => m.includes("Premium"));
    expect(motivacional).toBeDefined();
  });

  // ── Cálculo con pesos ────────────────────────────────────────────────

  it("aplica correctamente los pesos configurados", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 100,
      score_condiciones: 0,
      score_capacitaciones: 0,
      score_tareas: 0,
    });
    // Solo documentación vale: 100 * 0.30 = 30
    expect(result.score_general).toBeCloseTo(30, 1);
  });

  it("calcula correctamente la suma ponderada", () => {
    // 90*0.30 + 70*0.25 + 80*0.25 + 100*0.20 = 27+17.5+20+20 = 84.5
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 90,
      score_condiciones: 70,
      score_capacitaciones: 80,
      score_tareas: 100,
    });
    expect(result.score_general).toBeCloseTo(84.5, 1);
    expect(result.nivel).toBe("avanzado");
  });

  it("respeta pesos personalizados (no los default)", () => {
    const pesosCustom = {
      documentacion: 0.50,
      condiciones: 0.20,
      capacitaciones: 0.20,
      tareas: 0.10,
    };
    const result = calcularSello({
      pesos: pesosCustom,
      umbrales: UMBRALES_DEFAULT,
      score_documentacion: 100,
      score_condiciones: 0,
      score_capacitaciones: 0,
      score_tareas: 0,
    });
    expect(result.score_general).toBeCloseTo(50, 1);
    expect(result.pesos_usados).toEqual(pesosCustom);
  });

  // ── Umbrales ────────────────────────────────────────────────────────

  it("respeta umbrales custom para nivel inicial/intermedio", () => {
    const result = calcularSello({
      pesos: PESOS_DEFAULT,
      umbrales: { intermedio: 70, avanzado: 80, premium: 95 },
      score_documentacion: 65,
      score_condiciones: 65,
      score_capacitaciones: 65,
      score_tareas: 65,
    });
    expect(result.score_general).toBeCloseTo(65, 0);
    expect(result.nivel).toBe("inicial");
  });

  it("en el límite exacto de umbral es premium (>=)", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 90,
      score_condiciones: 90,
      score_capacitaciones: 90,
      score_tareas: 90,
    });
    expect(result.score_general).toBe(90);
    expect(result.nivel).toBe("premium");
  });

  it("en el límite exacto de umbral avanzado (>=75)", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 75,
      score_condiciones: 75,
      score_capacitaciones: 75,
      score_tareas: 75,
    });
    expect(result.score_general).toBe(75);
    expect(result.nivel).toBe("avanzado");
  });

  // ── Scores individuales preservados ─────────────────────────────────

  it("preserva los scores individuales en el resultado", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 85,
      score_condiciones: 70,
      score_capacitaciones: 90,
      score_tareas: 60,
    });
    expect(result.score_documentacion).toBe(85);
    expect(result.score_condiciones).toBe(70);
    expect(result.score_capacitaciones).toBe(90);
    expect(result.score_tareas).toBe(60);
  });

  // ── Validación Zod ───────────────────────────────────────────────────

  it("lanza error si score supera 100", () => {
    expect(() =>
      calcularSello({
        ...defaultInput,
        score_documentacion: 110,
        score_condiciones: 80,
        score_capacitaciones: 80,
        score_tareas: 80,
      })
    ).toThrow();
  });

  it("lanza error si score es negativo", () => {
    expect(() =>
      calcularSello({
        ...defaultInput,
        score_documentacion: -5,
        score_condiciones: 80,
        score_capacitaciones: 80,
        score_tareas: 80,
      })
    ).toThrow();
  });

  // ── Score 0 y 100 extremos ───────────────────────────────────────────

  it("maneja score 0 en todas las categorías", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 0,
      score_condiciones: 0,
      score_capacitaciones: 0,
      score_tareas: 0,
    });
    expect(result.score_general).toBe(0);
    expect(result.nivel).toBe("inicial");
    expect(result.descargos_habilitados).toBe(false);
    expect(result.plan_mejoras.length).toBeGreaterThan(0);
  });

  it("maneja score 100 en todas las categorías", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 100,
      score_condiciones: 100,
      score_capacitaciones: 100,
      score_tareas: 100,
    });
    expect(result.score_general).toBe(100);
    expect(result.nivel).toBe("premium");
    expect(result.descargos_habilitados).toBe(true);
    expect(result.plan_mejoras.length).toBe(0);
  });

  // ── Pesos guardados en resultado ─────────────────────────────────────

  it("guarda snapshot de pesos y umbrales en el resultado", () => {
    const result = calcularSello({
      ...defaultInput,
      score_documentacion: 80,
      score_condiciones: 80,
      score_capacitaciones: 80,
      score_tareas: 80,
    });
    expect(result.pesos_usados).toEqual(PESOS_DEFAULT);
    expect(result.umbrales_usados).toEqual(UMBRALES_DEFAULT);
  });
});
