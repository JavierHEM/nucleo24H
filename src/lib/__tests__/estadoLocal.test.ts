import { describe, expect, it } from "vitest";
import { claveRut, mismoRut } from "@/lib/empresas";
import { debeHabilitarTrasPago, estadoEmpresa, localOperable } from "@/lib/locales/estado";

describe("estado de locales y empresas", () => {
  it("un local solo se opera si está activo", () => {
    expect(localOperable("activo")).toBe(true);
    expect(localOperable("pendiente")).toBe(false);
    expect(localOperable("suspendido")).toBe(false);
    expect(localOperable("baja")).toBe(false);
    expect(debeHabilitarTrasPago("pendiente")).toBe(true);
    expect(debeHabilitarTrasPago("activo")).toBe(false);
  });

  it("la empresa sigue activa si al menos un local opera", () => {
    expect(estadoEmpresa(["suspendido", "activo", "baja"])).toBe("activa");
    expect(estadoEmpresa(["pendiente"])).toBe("pendiente");
    expect(estadoEmpresa(["pendiente", "activo"])).toBe("activa");
    expect(estadoEmpresa(["suspendido", "baja"])).toBe("suspendida");
    expect(estadoEmpresa(["baja"])).toBe("baja");
  });

  it("arma la ruta de la empresa por RUT normalizado", () => {
    expect(mismoRut("26.103.807-8", "26103807-8")).toBe(true);
    expect(`/admin/locales/${encodeURIComponent(claveRut("26.103.807-8"))}`).toBe(
      "/admin/locales/26103807-8"
    );
  });
});
