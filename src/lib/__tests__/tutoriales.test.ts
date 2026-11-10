import { describe, expect, it } from "vitest";
import { puedeGestionarTutoriales } from "@/lib/roles";
import { esTipoVideoTutorial, etiquetaRolesTutorial, puedeVerTutorial } from "@/lib/tutoriales";
import { construirRuta, esRutaTutorial, esVideoRuta, parseRuta } from "@/lib/storage/rutas";

const TUTORIAL = "a8f04228-e450-40af-984e-cd27cab9cde0";

describe("tutoriales", () => {
  it("solo admin_nucleo gestiona el módulo", () => {
    expect(puedeGestionarTutoriales("admin_nucleo")).toBe(true);
    expect(puedeGestionarTutoriales("asesor")).toBe(false);
    expect(puedeGestionarTutoriales("admin_local")).toBe(false);
    expect(puedeGestionarTutoriales("trabajador_local")).toBe(false);
  });

  it("el video se ve según el rol asignado", () => {
    expect(
      puedeVerTutorial({ rol: "admin_local", activo: true, roles: ["admin_local", "jefe_local"] })
    ).toBe(true);
    expect(
      puedeVerTutorial({ rol: "trabajador_local", activo: true, roles: ["admin_local"] })
    ).toBe(false);
  });

  it("admin_nucleo ve todos, incluso inactivos", () => {
    expect(puedeVerTutorial({ rol: "admin_nucleo", activo: false, roles: [] })).toBe(true);
  });

  it("un tutorial inactivo no se muestra al resto", () => {
    expect(puedeVerTutorial({ rol: "asesor", activo: false, roles: ["asesor"] })).toBe(false);
  });

  it("nombra los roles en español", () => {
    expect(etiquetaRolesTutorial(["trabajador_local", "asesor"])).toBe("Trabajador · Asesor");
  });

  it("guarda el video en el bucket tutoriales", () => {
    const { ruta } = construirRuta("tutoriales", TUTORIAL, "sello-mensual.mp4");
    expect(parseRuta(ruta)?.bucket).toBe("tutoriales");
    expect(esRutaTutorial(ruta)).toBe(true);
    expect(esVideoRuta(ruta)).toBe(true);
    expect(esRutaTutorial(`documentos/${TUTORIAL}/acta.pdf`)).toBe(false);
  });

  it("acepta mp4 y webm", () => {
    expect(esTipoVideoTutorial("video/mp4")).toBe(true);
    expect(esTipoVideoTutorial("video/webm")).toBe(true);
    expect(esTipoVideoTutorial("application/pdf")).toBe(false);
  });
});
