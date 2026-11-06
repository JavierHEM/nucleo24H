import { describe, expect, it } from "vitest";
import {
  adjuntosDeMensaje,
  evidenciasPeticion,
  nombreArchivoPeticion,
} from "@/lib/comunicaciones/adjuntos";

describe("evidencia de peticiones", () => {
  it("junta el adjunto legado con el arreglo nuevo", () => {
    expect(
      adjuntosDeMensaje({
        adjunto_url: "documentos/t/a.pdf",
        adjuntos: ["documentos/t/b.jpg"],
      })
    ).toEqual(["documentos/t/b.jpg", "documentos/t/a.pdf"]);
  });

  it("lista las evidencias del caso sin duplicar", () => {
    expect(
      evidenciasPeticion({
        adjuntos: ["documentos/t/caso.jpg"],
        mensajes: [
          { adjuntos: ["documentos/t/caso.jpg"] },
          { adjunto_url: "documentos/t/respuesta.pdf", adjuntos: [] },
        ],
      })
    ).toEqual(["documentos/t/caso.jpg", "documentos/t/respuesta.pdf"]);
  });

  it("muestra un nombre legible", () => {
    expect(nombreArchivoPeticion("documentos/t/1730000000000-acta-seremi.pdf")).toBe("acta-seremi.pdf");
  });
});
