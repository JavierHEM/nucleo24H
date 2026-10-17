import { describe, expect, it } from "vitest";
import {
  PAUTA_VISITA,
  noConformidadesDe,
  protocolosCubiertos,
  validarEvaluacion,
  type ItemEvaluacion,
} from "@/lib/bpm/visita";

function pauta(
  resultado: ItemEvaluacion["resultado"],
  extra?: Partial<ItemEvaluacion>
): ItemEvaluacion[] {
  return PAUTA_VISITA.map((punto) => ({
    area: punto.id,
    resultado,
    ...extra,
  }));
}

describe("pauta de visita", () => {
  it("cubre cada procedimiento oficial", () => {
    expect(protocolosCubiertos()).toBe(true);
  });

  it("exige marcar toda la pauta en una visita programada", () => {
    const items = pauta("cumple");
    items[0] = { area: items[0].area, resultado: "no_revisada" };
    expect(validarEvaluacion("programada", items)).toMatch(/cada punto/);
    expect(validarEvaluacion("programada", pauta("cumple"))).toBeNull();
  });

  it("en una sorpresa basta con lo que se revisó", () => {
    const items = pauta("no_revisada");
    expect(validarEvaluacion("sorpresa", items)).toMatch(/al menos un punto/);
    items[2] = { area: items[2].area, resultado: "cumple" };
    expect(validarEvaluacion("sorpresa", items)).toBeNull();
  });

  it("una observación o un no cumple abre la no conformidad de ese punto", () => {
    const items = pauta("cumple");
    items[3] = {
      area: items[3].area,
      resultado: "observacion",
      nota: "Falta el registro de hoy",
    };
    items[4] = {
      area: items[4].area,
      resultado: "no_cumple",
      nota: "Hay evidencia de plaga en el acceso",
      fecha_limite: "2026-10-20",
    };

    expect(validarEvaluacion("programada", items)).toBeNull();
    expect(noConformidadesDe(items)).toEqual([
      {
        area: items[3].area,
        descripcion: "Falta el registro de hoy",
        severidad: "menor",
        fecha_limite: undefined,
      },
      {
        area: items[4].area,
        descripcion: "Hay evidencia de plaga en el acceso",
        severidad: "mayor",
        fecha_limite: "2026-10-20",
      },
    ]);
  });

  it("no deja cerrar un no cumple sin fecha límite", () => {
    const items = pauta("cumple");
    items[0] = {
      area: items[0].area,
      resultado: "no_cumple",
      nota: "El permiso sanitario está vencido",
    };
    expect(validarEvaluacion("programada", items)).toMatch(/fecha límite/);
  });
});
