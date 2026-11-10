import { describe, expect, it } from "vitest";
import {
  documentosHabilitanSello,
  mensajeBloqueoSelloPorDocumentos,
} from "@/lib/locales/documentosLocal";

describe("documentos del local para el sello", () => {
  it("solo habilita el sello con ambos documentos", () => {
    expect(
      documentosHabilitanSello({
        resolucion_sanitaria_presentada: false,
        patente_comercial_al_dia: false,
      })
    ).toBe(false);
    expect(
      documentosHabilitanSello({
        resolucion_sanitaria_presentada: true,
        patente_comercial_al_dia: false,
      })
    ).toBe(false);
    expect(
      documentosHabilitanSello({
        resolucion_sanitaria_presentada: false,
        patente_comercial_al_dia: true,
      })
    ).toBe(false);
    expect(
      documentosHabilitanSello({
        resolucion_sanitaria_presentada: true,
        patente_comercial_al_dia: true,
      })
    ).toBe(true);
  });

  it("explica qué falta", () => {
    expect(
      mensajeBloqueoSelloPorDocumentos({
        resolucion_sanitaria_presentada: true,
        patente_comercial_al_dia: true,
      })
    ).toBeNull();
    expect(
      mensajeBloqueoSelloPorDocumentos({
        resolucion_sanitaria_presentada: false,
        patente_comercial_al_dia: true,
      })
    ).toContain("resolución sanitaria");
    expect(
      mensajeBloqueoSelloPorDocumentos({
        resolucion_sanitaria_presentada: false,
        patente_comercial_al_dia: false,
      })
    ).toContain("patente comercial al día");
  });
});
