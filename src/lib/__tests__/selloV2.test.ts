import { describe, expect, it } from "vitest";
import { calcularSelloV2, nivelDesdePuntaje, puntajeComponente } from "@/lib/sellos/v2";

describe("puntajeComponente", () => {
  it("redistribuye los puntos entre controles aplicables", () => {
    expect(
      puntajeComponente(20, [
        { id: "a", aplicable: true, logro: 1 },
        { id: "b", aplicable: false, logro: 0 },
        { id: "c", aplicable: true, logro: 1 },
      ])
    ).toBe(20);
  });

  it("la falta de evidencia no suma", () => {
    expect(puntajeComponente(20, [{ id: "a", aplicable: true, logro: 0 }])).toBe(0);
  });

  it("sin controles aplicables el componente vale 0", () => {
    expect(puntajeComponente(15, [{ id: "a", aplicable: false, logro: 1 }])).toBe(0);
  });
});

describe("nivelDesdePuntaje", () => {
  it("asigna Bronce Plata Oro y sin sello", () => {
    expect(nivelDesdePuntaje(69.9, false)).toBe("sin_sello");
    expect(nivelDesdePuntaje(70, false)).toBe("bronce");
    expect(nivelDesdePuntaje(84.9, false)).toBe("bronce");
    expect(nivelDesdePuntaje(85, false)).toBe("plata");
    expect(nivelDesdePuntaje(94.9, false)).toBe("plata");
    expect(nivelDesdePuntaje(95, false)).toBe("oro");
    expect(nivelDesdePuntaje(100, false)).toBe("oro");
  });

  it("un crítico abierto bloquea cualquier sello", () => {
    expect(nivelDesdePuntaje(100, true)).toBe("sin_sello");
  });
});

describe("bloqueo por documentos del local", () => {
  const lleno = (n: number) => [{ id: "x", aplicable: true, logro: 1 as const }];

  it("sin resolución o patente no hay sello aunque el puntaje sea 100", () => {
    const r = calcularSelloV2({
      seguimiento: { registros: lleno(1), controles: lleno(1), correctivas: lleno(1), procedimientos: lleno(1) },
      visita: { higiene: lleno(1), instalaciones: lleno(1), almacenamiento: lleno(1), verificacion: lleno(1) },
      bloqueoCritico: false,
      bloqueoDocumentos: true,
      motivoBloqueoDocumentos: "Este local no puede obtener el sello de Núcleo: falta resolución sanitaria.",
    });
    expect(r.nivel).toBe("sin_sello");
    expect(r.bloqueo_documentos).toBe(true);
    expect(r.plan_mejoras[0]).toContain("resolución sanitaria");
  });
});

describe("calcularSelloV2", () => {
  const lleno = (n: number) => [{ id: "x", aplicable: true, logro: 1 as const }];

  it("un mes perfecto llega a Oro", () => {
    const r = calcularSelloV2({
      seguimiento: { registros: lleno(1), controles: lleno(1), correctivas: lleno(1), procedimientos: lleno(1) },
      visita: { higiene: lleno(1), instalaciones: lleno(1), almacenamiento: lleno(1), verificacion: lleno(1) },
      bloqueoCritico: false,
    });
    expect(r.score_seguimiento).toBe(60);
    expect(r.score_visita).toBe(40);
    expect(r.score_general).toBe(100);
    expect(r.nivel).toBe("oro");
  });

  it("un crítico cerrado no impide Oro", () => {
    const r = calcularSelloV2({
      seguimiento: { registros: lleno(1), controles: lleno(1), correctivas: lleno(1), procedimientos: lleno(1) },
      visita: { higiene: lleno(1), instalaciones: lleno(1), almacenamiento: lleno(1), verificacion: lleno(1) },
      bloqueoCritico: false,
    });
    expect(r.nivel).toBe("oro");
  });
});
