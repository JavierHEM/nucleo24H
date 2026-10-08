import { describe, expect, it } from "vitest";
import {
  debePromoverRol,
  puedeAsignarCargos,
  puedeInvitarConRol,
  puedeRemoverMiembro,
} from "@/lib/roles";

describe("jefe_local", () => {
  it("admin y núcleo pueden invitar jefe, trabajador y admin local", () => {
    for (const actor of ["admin_local", "admin_nucleo"] as const) {
      expect(puedeAsignarCargos(actor)).toBe(true);
      expect(puedeInvitarConRol(actor, "jefe_local")).toBe(true);
      expect(puedeInvitarConRol(actor, "trabajador_local")).toBe(true);
      expect(puedeInvitarConRol(actor, "admin_local")).toBe(true);
    }
  });

  it("el jefe solo invita trabajadores", () => {
    expect(puedeAsignarCargos("jefe_local")).toBe(false);
    expect(puedeInvitarConRol("jefe_local", "trabajador_local")).toBe(true);
    expect(puedeInvitarConRol("jefe_local", "jefe_local")).toBe(false);
    expect(puedeInvitarConRol("jefe_local", "admin_local")).toBe(false);
  });

  it("vincular un local no baja de rol", () => {
    expect(debePromoverRol("trabajador_local", "jefe_local")).toBe(true);
    expect(debePromoverRol("jefe_local", "jefe_local")).toBe(false);
    expect(debePromoverRol("admin_local", "jefe_local")).toBe(false);
    expect(debePromoverRol("jefe_local", "admin_local")).toBe(true);
  });

  it("el jefe solo remueve trabajadores, y nadie se remueve a sí mismo", () => {
    expect(puedeRemoverMiembro("jefe_local", "trabajador_local", "b", "a")).toBe(true);
    expect(puedeRemoverMiembro("jefe_local", "admin_local", "b", "a")).toBe(false);
    expect(puedeRemoverMiembro("jefe_local", "jefe_local", "b", "a")).toBe(false);
    expect(puedeRemoverMiembro("admin_local", "trabajador_local", "a", "a")).toBe(false);
  });
});
