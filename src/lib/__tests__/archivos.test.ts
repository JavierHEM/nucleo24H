import { describe, expect, it } from "vitest";
import { construirRuta, esImagenRuta, hrefArchivo, parseRuta, rutaPertenece, sonRutasDocumentoDelLocal, sonRutasHallazgoDelLocal } from "@/lib/storage/rutas";

const TENANT = "a8f04228-e450-40af-984e-cd27cab9cde0";

describe("rutas de storage", () => {
  it("arma una ruta privada dentro del local", () => {
    const { ruta } = construirRuta("registros", TENANT, "Planilla Higiene.pdf");
    const parsed = parseRuta(ruta);
    expect(parsed?.bucket).toBe("registros");
    expect(parsed?.tenantId).toBe(TENANT);
    expect(rutaPertenece(ruta, "registros", TENANT)).toBe(true);
    expect(rutaPertenece(ruta, "documentos", TENANT)).toBe(false);
  });

  it("abre los archivos nuevos por el enlace firmado y conserva una URL antigua", () => {
    expect(hrefArchivo(`registros/${TENANT}/1-planilla.pdf`)).toContain("/api/archivos?ruta=");
    expect(hrefArchivo("https://ejemplo.r2.dev/viejo.pdf")).toBe("https://ejemplo.r2.dev/viejo.pdf");
  });

  it("acepta fotos de hallazgo del mismo local", () => {
    const { ruta } = construirRuta("hallazgos", TENANT, "roedor-camara.jpg");
    expect(parseRuta(ruta)?.bucket).toBe("hallazgos");
    expect(rutaPertenece(ruta, "hallazgos", TENANT)).toBe(true);
    expect(rutaPertenece(ruta, "documentos", TENANT)).toBe(false);
    expect(sonRutasHallazgoDelLocal([ruta], TENANT)).toBe(true);
    expect(sonRutasHallazgoDelLocal([`documentos/${TENANT}/acta.pdf`], TENANT)).toBe(false);
    expect(esImagenRuta(ruta)).toBe(true);
  });

  it("arma la ruta de un video de tutorial", () => {
    const { ruta } = construirRuta("tutoriales", TENANT, "como-cargar-sello.mp4");
    expect(parseRuta(ruta)?.bucket).toBe("tutoriales");
    expect(rutaPertenece(ruta, "tutoriales", TENANT)).toBe(true);
  });

  it("acepta autorización o informe del proveedor del mismo local", () => {
    const { ruta } = construirRuta("documentos", TENANT, "autorizacion-seremi.pdf");
    expect(sonRutasDocumentoDelLocal([ruta], TENANT)).toBe(true);
    expect(sonRutasDocumentoDelLocal([`hallazgos/${TENANT}/foto.jpg`], TENANT)).toBe(false);
  });
});
