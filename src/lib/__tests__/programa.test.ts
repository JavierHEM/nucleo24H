import { describe, expect, it } from "vitest";
import { armarAgenda, programaResuelto } from "@/lib/bpm/programa";

const AHORA = new Date("2026-10-08T18:00:00.000Z");

function registro(codigo: string, fecha: string, datos: Record<string, unknown> = { cumple: "si" }) {
  return { codigo, fecha, datos };
}

describe("agenda del día", () => {
  const programa = programaResuelto(null);

  it("pide la temperatura al inicio y deja la recepción como evento", () => {
    const agenda = armarAgenda({ programa, registros: [], equipos: ["Cámara de frío"], ahora: AHORA });
    const temperatura = agenda.hoy.find((item) => item.codigo === "R-BPM-05-02");
    expect(temperatura?.estado).toBe("pendiente");
    expect(temperatura?.cuando).toBe("Al inicio de la jornada");
    expect(agenda.hoy.some((item) => item.codigo === "R-BPM-04-02")).toBe(false);
    expect(agenda.eventos.some((item) => item.codigo === "R-BPM-04-02")).toBe(true);
  });

  it("marca hecho un control del día y con observación si no cumple", () => {
    const limpio = armarAgenda({
      programa,
      registros: [registro("R-BPM-07-02", "2026-10-08T15:00:00.000Z", { disponible: "si" })],
      equipos: [],
      ahora: AHORA,
    });
    expect(limpio.hoy.find((item) => item.codigo === "R-BPM-07-02")?.estado).toBe("hecho");

    const mal = armarAgenda({
      programa,
      registros: [registro("R-BPM-07-02", "2026-10-08T15:00:00.000Z", { disponible: "no", accion: "Se cortó el agua" })],
      equipos: [],
      ahora: AHORA,
    });
    expect(mal.hoy.find((item) => item.codigo === "R-BPM-07-02")?.estado).toBe("observacion");
  });

  it("considera hecha la higiene semanal si ya se registró el lunes", () => {
    const agenda = armarAgenda({
      programa,
      registros: [registro("R-BPM-01-02", "2026-10-05T15:00:00.000Z")],
      equipos: [],
      ahora: AHORA,
    });
    expect(agenda.hoy.find((item) => item.codigo === "R-BPM-01-02")?.estado).toBe("hecho");
  });

  it("sigue pidiendo la temperatura del equipo que falta", () => {
    const agenda = armarAgenda({
      programa,
      registros: [registro("R-BPM-05-02", "2026-10-08T12:00:00.000Z", { equipo: "Cámara de frío", cumple: "si" })],
      equipos: ["Cámara de frío", "Freezer"],
      ahora: AHORA,
    });
    const temperatura = agenda.hoy.find((item) => item.codigo === "R-BPM-05-02");
    expect(temperatura?.estado).toBe("pendiente");
    expect(temperatura?.detalle).toBe("Falta Freezer");
  });

  it("respeta el programa del local", () => {
    const ajustado = programaResuelto([
      { codigo: "R-BPM-05-02", activa: false, modo: "turno", momento: "inicio", cadencia: "dia" },
      { codigo: "R-BPM-08-02", activa: true, modo: "turno", momento: "durante", cadencia: "dia" },
    ]);
    const agenda = armarAgenda({ programa: ajustado, registros: [], equipos: [], ahora: AHORA });
    expect(agenda.hoy.some((item) => item.codigo === "R-BPM-05-02")).toBe(false);
    expect(agenda.hoy.find((item) => item.codigo === "R-BPM-08-02")?.cuando).toBe("Durante el turno");
    expect(agenda.eventos.some((item) => item.codigo === "R-BPM-08-02")).toBe(false);
  });

  it("deja fuera de la agenda una planilla apagada", () => {
    const ajustado = programaResuelto([
      { codigo: "R-BPM-07-02", activa: false, modo: "turno", momento: "inicio", cadencia: "dia" },
    ]);
    const agenda = armarAgenda({ programa: ajustado, registros: [], equipos: [], ahora: AHORA });
    expect(agenda.hoy.some((item) => item.codigo === "R-BPM-07-02")).toBe(false);
    expect(agenda.eventos.some((item) => item.codigo === "R-BPM-07-02")).toBe(false);
  });
});
