import { describe, expect, it } from "vitest";
import { construirRuta, hrefArchivo, parseRuta, rutaPertenece } from "@/lib/storage/rutas";

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
});
