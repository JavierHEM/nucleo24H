import { describe, expect, it } from "vitest";
import { evaluarProgramaDelMes } from "@/lib/bpm/evaluarMes";
import { programaResuelto } from "@/lib/bpm/programa";
import { calcularSello } from "@/server/sello-engine/calcular";
import { scoreProgramaOperacion } from "@/server/sello-engine/recolectar";
import { PESOS_DEFAULT, UMBRALES_DEFAULT } from "@/server/sello-engine/tipos";

const AHORA = new Date("2026-10-01T18:00:00.000Z");
const programa = programaResuelto(null).map((item) => ({
  ...item,
  activa: item.codigo === "R-BPM-07-02" || item.codigo === "R-BPM-04-02",
  modo: item.codigo === "R-BPM-04-02" ? ("evento" as const) : item.modo,
}));

describe("evaluación del mes para el sello", () => {
  it("marca el control del día que no se registró", () => {
    const resultado = evaluarProgramaDelMes({
      programa,
      registros: [],
      equipos: [],
      periodo: "2026-10",
      ahora: AHORA,
    });
    expect(resultado.estados).toEqual(["pendiente"]);
    expect(resultado.hallazgos[0]?.texto).toMatch(/Faltó/);
    expect(resultado.eventosSinAccion).toBe(0);
  });

  it("deja en observación el control que no cumple y no penaliza un evento que no ocurrió", () => {
    const resultado = evaluarProgramaDelMes({
      programa,
      registros: [
        {
          codigo: "R-BPM-07-02",
          fecha: "2026-10-01T15:00:00.000Z",
          datos: { disponible: "no", accion: "Se cortó el agua" },
        },
      ],
      equipos: [],
      periodo: "2026-10",
      ahora: AHORA,
    });
    expect(resultado.estados).toEqual(["observacion"]);
    expect(resultado.eventosSinAccion).toBe(0);
    expect(scoreProgramaOperacion({ estados: resultado.estados, eventosSinAccion: 0, ncAbiertasMayores: 0, ncAbiertasMenores: 0 })).toBe(50);
  });

  it("resta el evento que quedó sin acción correctiva", () => {
    const resultado = evaluarProgramaDelMes({
      programa,
      registros: [
        {
          codigo: "R-BPM-07-02",
          fecha: "2026-10-01T15:00:00.000Z",
          datos: { disponible: "si" },
        },
        {
          codigo: "R-BPM-04-02",
          fecha: "2026-10-01T16:00:00.000Z",
          datos: { decision: "rechaza" },
        },
      ],
      equipos: [],
      periodo: "2026-10",
      ahora: AHORA,
    });
    expect(resultado.eventosSinAccion).toBe(1);
    expect(resultado.hallazgos.some((item) => item.texto.includes("sin acción"))).toBe(true);
  });

  it("usa el hallazgo concreto en el plan cuando la nota sigue bajo el mínimo", () => {
    const sello = calcularSello({
      score_documentacion: 100,
      score_condiciones: 40,
      score_capacitaciones: 100,
      score_tareas: 100,
      pesos: PESOS_DEFAULT,
      umbrales: UMBRALES_DEFAULT,
      hallazgos: [{ dimension: "condiciones", texto: "Faltó la temperatura en 6 días." }],
    });
    expect(sello.plan_mejoras).toContain("Faltó la temperatura en 6 días.");
  });
});
