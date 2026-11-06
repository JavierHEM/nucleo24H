import { describe, it, expect } from "vitest";
import {
  TICKET_ESTADOS_ABIERTOS,
  destinatariosNuevaPeticion,
  destinatariosRespuesta,
  esLocalComunicaciones,
  esStaffNucleo,
  estadoTrasRespuesta,
  transicionTicket,
} from "@/lib/comunicaciones/tickets";

describe("TICKET_ESTADOS_ABIERTOS", () => {
  it("deja fuera las resueltas", () => {
    expect(TICKET_ESTADOS_ABIERTOS).toEqual(["abierta", "en_atencion"]);
  });
});

describe("transicionTicket", () => {
  it("atiende solo si está abierta", () => {
    expect(transicionTicket("abierta", "atender")).toBe("en_atencion");
    expect(transicionTicket("en_atencion", "atender")).toBeNull();
    expect(transicionTicket("resuelta", "atender")).toBeNull();
  });

  it("resuelve desde abierta o en atención", () => {
    expect(transicionTicket("abierta", "resolver")).toBe("resuelta");
    expect(transicionTicket("en_atencion", "resolver")).toBe("resuelta");
    expect(transicionTicket("resuelta", "resolver")).toBeNull();
  });

  it("reabre solo si está resuelta", () => {
    expect(transicionTicket("resuelta", "reabrir")).toBe("abierta");
    expect(transicionTicket("abierta", "reabrir")).toBeNull();
  });
});

describe("estadoTrasRespuesta", () => {
  it("el staff pasa abierta a en atención", () => {
    expect(estadoTrasRespuesta({ estadoActual: "abierta", respondeStaff: true })).toBe("en_atencion");
    expect(estadoTrasRespuesta({ estadoActual: "en_atencion", respondeStaff: true })).toBeNull();
  });

  it("el local reabre si ya estaba resuelta", () => {
    expect(estadoTrasRespuesta({ estadoActual: "resuelta", respondeStaff: false })).toBe("abierta");
    expect(estadoTrasRespuesta({ estadoActual: "abierta", respondeStaff: false })).toBeNull();
  });
});

describe("destinatarios", () => {
  it("notifica al asesor y a casa central, nunca al autor", () => {
    expect(
      destinatariosNuevaPeticion({
        autorId: "local",
        asesorId: "asesor",
        adminNucleoIds: ["admin", "local"],
      }).sort()
    ).toEqual(["admin", "asesor"]);
  });

  it("si no hay asesor, notifica a los admin_nucleo", () => {
    expect(destinatariosNuevaPeticion({ autorId: "local", asesorId: null, adminNucleoIds: ["admin"] })).toEqual([
      "admin",
    ]);
  });

  it("una respuesta de Núcleo avisa al local", () => {
    expect(
      destinatariosRespuesta({
        autorId: "local",
        asignadoId: "asesor",
        adminNucleoIds: ["admin"],
        remitenteId: "asesor",
        respondeStaff: true,
      })
    ).toEqual(["local"]);
  });

  it("una respuesta del local avisa al asignado y a casa central", () => {
    expect(
      destinatariosRespuesta({
        autorId: "local",
        asignadoId: "asesor",
        adminNucleoIds: ["admin"],
        remitenteId: "local",
        respondeStaff: false,
      }).sort()
    ).toEqual(["admin", "asesor"]);
  });
});

describe("roles", () => {
  it("distingue local y staff", () => {
    expect(esLocalComunicaciones("admin_local")).toBe(true);
    expect(esLocalComunicaciones("trabajador_local")).toBe(false);
    expect(esStaffNucleo("asesor")).toBe(true);
    expect(esStaffNucleo("admin_nucleo")).toBe(true);
    expect(esStaffNucleo("admin_local")).toBe(false);
  });
});
