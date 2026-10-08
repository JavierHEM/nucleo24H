import { describe, expect, it } from "vitest";
import {
  getPlanilla,
  limiteDeEquipo,
  resumenRegistro,
  schemaDePlanilla,
  textoAvisoPlanillaPapel,
} from "@/lib/bpm/planillas";

describe("planillas BPM", () => {
  it("exige acción correctiva si la temperatura no cumple", () => {
    const planilla = getPlanilla("R-BPM-05-02");
    expect(planilla).toBeDefined();
    const parsed = schemaDePlanilla(planilla!).safeParse({
      fecha: "2026-10-08",
      hora: "08:00",
      equipo: "Cámara de frío",
      limite: "0 a 5 °C",
      temperatura: 12,
      cumple: "no",
      accion: "",
      responsable: "Ana Soto",
    });
    expect(parsed.success).toBe(false);
  });

  it("resume el registro de frío con equipo y límite", () => {
    expect(
      resumenRegistro("R-BPM-05-02", "almacenamiento", {
        equipo: "Freezer",
        temperatura: -18,
        limite: "máximo -12 °C",
      })
    ).toContain("Freezer");
  });

  it("avisa al asesor con el código de la planilla impresa", () => {
    expect(textoAvisoPlanillaPapel("R-BPM-01-02", "Lista de verificación de higiene del personal")).toContain(
      "R-BPM-01-02"
    );
  });

  it("arma el límite desde la configuración del equipo", () => {
    expect(limiteDeEquipo({ limite_min: 0, limite_max: 5 })).toBe("0 a 5 °C");
    expect(limiteDeEquipo({ limite_max: -12 })).toBe("máximo -12 °C");
  });
});
