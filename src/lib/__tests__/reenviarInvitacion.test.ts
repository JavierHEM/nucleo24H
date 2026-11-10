import { describe, expect, it } from "vitest";
import {
  esRolInvitacion,
  nextReenvioInvitacion,
  puedeReenviarInvitacion,
  tenantInvitacionLocal,
} from "@/lib/auth/reenviarInvitacion";

describe("reenviar invitación", () => {
  it("solo reenvía si la cuenta está activa y aún no creó su clave", () => {
    expect(puedeReenviarInvitacion({ activo: true, claveDefinida: false })).toBe(true);
    expect(puedeReenviarInvitacion({ activo: true, claveDefinida: true })).toBe(false);
    expect(puedeReenviarInvitacion({ activo: false, claveDefinida: false })).toBe(false);
  });

  it("manda a Núcleo al panel admin y al asesor a informes", () => {
    expect(nextReenvioInvitacion("admin_nucleo")).toBe("/admin");
    expect(nextReenvioInvitacion("asesor")).toBe("/asesor/informes");
    expect(nextReenvioInvitacion("admin_local")).toBe("/");
  });

  it("elige el local del metadata si sigue vinculado", () => {
    const vinculos = [
      { id: "casa", nombre: "Casa matriz" },
      { id: "suc", nombre: "Sucursal" },
    ];
    expect(tenantInvitacionLocal("suc", vinculos)?.id).toBe("suc");
    expect(tenantInvitacionLocal("otro", vinculos)?.id).toBe("casa");
    expect(tenantInvitacionLocal(null, [])).toBeNull();
  });

  it("reconoce los roles que reciben invitación", () => {
    expect(esRolInvitacion("admin_nucleo")).toBe(true);
    expect(esRolInvitacion("trabajador_local")).toBe(true);
    expect(esRolInvitacion("desconocido")).toBe(false);
  });
});
