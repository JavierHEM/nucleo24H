import { describe, expect, it } from "vitest";
import {
  armarConstancias,
  etiquetaEventoDeclaracion,
  etiquetaTipoDeclaracion,
} from "../declaraciones/constancia";

describe("etiquetaTipoDeclaracion", () => {
  it("usa el título de la casilla A y B", () => {
    expect(etiquetaTipoDeclaracion("A")).toContain("Al completar un registro");
    expect(etiquetaTipoDeclaracion("B")).toContain("Al adjuntar");
  });
});

describe("etiquetaEventoDeclaracion", () => {
  it("traduce los eventos de registro y documento", () => {
    expect(etiquetaEventoDeclaracion("completar_registro")).toBe("Completar registro");
    expect(etiquetaEventoDeclaracion("cargar_planilla_papel")).toBe("Cargar planilla en papel");
    expect(etiquetaEventoDeclaracion("adjuntar_documento")).toBe("Adjuntar documento");
  });
});

describe("armarConstancias", () => {
  it("adjunta el firmante y conserva el texto versionado", () => {
    const [constancia] = armarConstancias(
      [
        {
          id: "d1",
          tipo: "A",
          version: "2026-11",
          texto: "Declaro que la información ingresada...",
          evento: "completar_registro",
          created_at: new Date("2026-11-04T15:00:00Z"),
          user_id: "u1",
        },
      ],
      { u1: "Ana Pérez" }
    );
    expect(constancia.firmante).toBe("Ana Pérez");
    expect(constancia.texto).toContain("información ingresada");
    expect(constancia.version).toBe("2026-11");
  });

  it("marca firmante ausente si el usuario ya no existe", () => {
    const [constancia] = armarConstancias(
      [
        {
          id: "d2",
          tipo: "B",
          version: "2026-11",
          texto: "Declaro que los archivos...",
          evento: "adjuntar_documento",
          created_at: new Date(),
          user_id: "borrado",
        },
      ],
      {}
    );
    expect(constancia.firmante).toBe("Usuario no disponible");
  });
});
