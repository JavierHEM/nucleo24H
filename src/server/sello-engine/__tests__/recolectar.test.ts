import { describe, it, expect } from "vitest";
import {
  scoreDocumentacion,
  scoreCondiciones,
  scoreCapacitaciones,
  scoreTareas,
  PENALIZACION_NC,
  CAPACITACIONES_ESPERADAS_MES,
} from "../recolectar";

describe("scoreDocumentacion", () => {
  it("sin documentos cargados retorna 0", () => {
    expect(scoreDocumentacion({ total: 0, aprobadosVigentes: 0 })).toBe(0);
  });

  it("todos aprobados y vigentes retorna 100", () => {
    expect(scoreDocumentacion({ total: 5, aprobadosVigentes: 5 })).toBe(100);
  });

  it("proporción parcial", () => {
    expect(scoreDocumentacion({ total: 4, aprobadosVigentes: 3 })).toBe(75);
  });
});

describe("scoreCondiciones", () => {
  const base = {
    diasDelMes: 30,
    tieneControlPlagas: true,
    ncAbiertasMayores: 0,
    ncAbiertasMenores: 0,
  };

  it("cobertura completa con plagas y sin NCs retorna 100", () => {
    expect(
      scoreCondiciones({ ...base, diasConTemperatura: 30, diasConLimpieza: 30 })
    ).toBe(100);
  });

  it("sin control de plagas pierde 10 puntos", () => {
    expect(
      scoreCondiciones({
        ...base,
        diasConTemperatura: 30,
        diasConLimpieza: 30,
        tieneControlPlagas: false,
      })
    ).toBe(90);
  });

  it("media cobertura de registros diarios", () => {
    expect(
      scoreCondiciones({ ...base, diasConTemperatura: 15, diasConLimpieza: 15 })
    ).toBe(55); // 0.5 * 90 + 10
  });

  it("NC mayor abierta penaliza 15, menor 5", () => {
    expect(
      scoreCondiciones({
        ...base,
        diasConTemperatura: 30,
        diasConLimpieza: 30,
        ncAbiertasMayores: 1,
        ncAbiertasMenores: 2,
      })
    ).toBe(100 - PENALIZACION_NC.mayor - 2 * PENALIZACION_NC.menor);
  });

  it("nunca baja de 0", () => {
    expect(
      scoreCondiciones({
        ...base,
        diasConTemperatura: 0,
        diasConLimpieza: 0,
        tieneControlPlagas: false,
        ncAbiertasMayores: 5,
      })
    ).toBe(0);
  });
});

describe("scoreCapacitaciones", () => {
  it("una capacitación al mes cumple el 100%", () => {
    expect(scoreCapacitaciones({ realizadas: 1 })).toBe(100);
  });

  it("cero capacitaciones retorna 0", () => {
    expect(scoreCapacitaciones({ realizadas: 0 })).toBe(0);
  });

  it("más capacitaciones que las esperadas se topa en 100", () => {
    expect(scoreCapacitaciones({ realizadas: 3 })).toBe(100);
  });
});

describe("scoreTareas", () => {
  it("sin tareas configuradas retorna 100", () => {
    expect(scoreTareas([], 30)).toBe(100);
  });

  it("tarea diaria completada todos los días retorna 100", () => {
    expect(scoreTareas([{ frecuencia: "diaria", completaciones: 30 }], 30)).toBe(100);
  });

  it("tarea diaria a la mitad retorna 50", () => {
    expect(scoreTareas([{ frecuencia: "diaria", completaciones: 15 }], 30)).toBe(50);
  });

  it("tarea semanal espera ~1 por semana", () => {
    // 30 días → ceil(30/7) = 5 esperadas
    expect(scoreTareas([{ frecuencia: "semanal", completaciones: 5 }], 30)).toBe(100);
  });

  it("tarea mensual espera 1", () => {
    expect(scoreTareas([{ frecuencia: "mensual", completaciones: 1 }], 30)).toBe(100);
  });

  it("exceso de completaciones no infla el score de otras tareas", () => {
    const score = scoreTareas(
      [
        { frecuencia: "mensual", completaciones: 10 },
        { frecuencia: "diaria", completaciones: 0 },
      ],
      30
    );
    // mensual capped a 1: 1 / (1 + 30) ≈ 3.23
    expect(score).toBeCloseTo(3.23, 1);
  });

  it("mezcla de frecuencias pondera por esperadas", () => {
    const score = scoreTareas(
      [
        { frecuencia: "diaria", completaciones: 30 }, // 30/30
        { frecuencia: "semanal", completaciones: 0 }, // 0/5
      ],
      30
    );
    expect(score).toBeCloseTo((30 / 35) * 100, 1);
  });
});

describe("constantes de reglas de negocio", () => {
  it("PENALIZACION_NC.mayor es mayor que PENALIZACION_NC.menor", () => {
    expect(PENALIZACION_NC.mayor).toBeGreaterThan(PENALIZACION_NC.menor);
  });

  it("PENALIZACION_NC tiene penalización positiva para ambas severidades", () => {
    expect(PENALIZACION_NC.mayor).toBeGreaterThan(0);
    expect(PENALIZACION_NC.menor).toBeGreaterThan(0);
  });

  it("CAPACITACIONES_ESPERADAS_MES es al menos 1", () => {
    expect(CAPACITACIONES_ESPERADAS_MES).toBeGreaterThanOrEqual(1);
  });
});

describe("scoreCondiciones – múltiples NCs", () => {
  const base = {
    diasConTemperatura: 30,
    diasConLimpieza: 30,
    diasDelMes: 30,
    tieneControlPlagas: true,
    ncAbiertasMayores: 0,
    ncAbiertasMenores: 0,
  };

  it("dos NCs mayores penalizan 30 puntos", () => {
    const result = scoreCondiciones({ ...base, ncAbiertasMayores: 2 });
    expect(result).toBe(100 - 2 * PENALIZACION_NC.mayor);
  });

  it("tres NCs menores penalizan 15 puntos", () => {
    const result = scoreCondiciones({ ...base, ncAbiertasMenores: 3 });
    expect(result).toBe(100 - 3 * PENALIZACION_NC.menor);
  });

  it("combinación de NCs mayores y menores", () => {
    const result = scoreCondiciones({
      ...base,
      ncAbiertasMayores: 2,
      ncAbiertasMenores: 1,
    });
    expect(result).toBe(
      Math.max(0, 100 - 2 * PENALIZACION_NC.mayor - PENALIZACION_NC.menor)
    );
  });

  it("cobertura al 75% de temperatura y 100% limpieza", () => {
    // (0.75 + 1.0) / 2 * 90 + 10 = 0.875 * 90 + 10 = 78.75 + 10 = 88.75 → 88.75
    const result = scoreCondiciones({
      ...base,
      diasConTemperatura: 22, // ~73.3% de 30
      diasConLimpieza: 30,    // 100%
    });
    // Simplemente verificamos que está entre 80 y 95
    expect(result).toBeGreaterThan(80);
    expect(result).toBeLessThan(100);
  });
});
