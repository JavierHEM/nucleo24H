import { describe, it, expect } from "vitest";
import {
  agruparPorDia,
  armarCalendario,
  celdasDelMes,
  claveDia,
  esVisitaVisible,
  parseMes,
  proximosCobros,
  type FuentesCalendario,
} from "@/lib/calendario";

const ahora = new Date(2026, 5, 10, 9, 0);

const fuentes: FuentesCalendario = {
  visitas: [
    { id: "v1", tipo: "programada", estado: "agendada", fecha: new Date(2026, 5, 20) },
    { id: "v2", tipo: "sorpresa", estado: "agendada", fecha: new Date(2026, 5, 25) },
    { id: "v3", tipo: "programada", estado: "realizada", fecha: new Date(2026, 5, 5) },
    { id: "v4", tipo: "programada", estado: "cancelada", fecha: new Date(2026, 5, 22) },
  ],
  documentos: [
    { id: "d1", nombre: "Permiso sanitario", vencimiento: new Date(2026, 6, 1) },
    { id: "d2", nombre: "Sin fecha", vencimiento: null },
  ],
  noConformidades: [
    { id: "n1", descripcion: "Piso", estado: "abierta", fecha_limite: new Date(2026, 5, 30) },
    { id: "n2", descripcion: "Cerrada", estado: "cerrada", fecha_limite: new Date(2026, 5, 30) },
  ],
  ambiental: [{ id: "a1", tipo: "asesoria", vence: new Date(2026, 7, 1) }],
  suscripcion: { dia_cobro: 5, hasta: new Date(2026, 8, 1) },
};

const idsDe = (verSorpresas: boolean, verCobro = true) =>
  armarCalendario(fuentes, { ahora, verSorpresas, verCobro }).map((evento) => evento.id);

describe("visitas sorpresa", () => {
  it("el local nunca ve una visita sorpresa agendada", () => {
    expect(esVisitaVisible({ tipo: "sorpresa", estado: "agendada" }, false)).toBe(false);
    expect(idsDe(false)).not.toContain("visita-v2");
  });

  it("el asesor sí la ve", () => {
    expect(idsDe(true)).toContain("visita-v2");
  });

  it("no muestra visitas realizadas ni canceladas", () => {
    const ids = idsDe(true);
    expect(ids).not.toContain("visita-v3");
    expect(ids).not.toContain("visita-v4");
  });
});

describe("armarCalendario", () => {
  it("agrega documentos, plazos de NC, ambiental, cobro y fin de contrato", () => {
    const ids = idsDe(false);
    expect(ids).toEqual(expect.arrayContaining(["visita-v1", "documento-d1", "nc-n1", "ambiental-a1", "contrato-fin"]));
    expect(ids.some((id) => id.startsWith("cobro-"))).toBe(true);
  });

  it("omite no conformidades cerradas y documentos sin vencimiento", () => {
    const ids = idsDe(false);
    expect(ids).not.toContain("nc-n2");
    expect(ids).not.toContain("documento-d2");
  });

  it("oculta el cobro a quienes no pueden verlo", () => {
    expect(idsDe(false, false).some((id) => id.startsWith("cobro-"))).toBe(false);
  });

  it("devuelve los eventos ordenados por fecha", () => {
    const fechas = armarCalendario(fuentes, { ahora, verSorpresas: true, verCobro: true }).map((e) => e.fecha.getTime());
    expect(fechas).toEqual([...fechas].sort((a, b) => a - b));
  });

  it("agrega hallazgos, fiscalizaciones y descargos del local", () => {
    const eventos = armarCalendario(
      {
        ...fuentes,
        hallazgos: [
          {
            id: "a8f04228-4c11-4b2a-9d33-0e1f2a3b4c5d",
            descripcion: "Cámara sin registro de temperatura",
            gravedad: "mayor",
            estado: "abierto",
            plazo: new Date(2026, 5, 18),
            created_at: new Date(2026, 5, 12),
            local: "Los Robles",
            tenant_id: "t1",
          },
        ],
        fiscalizaciones: [
          {
            id: "f1",
            fecha: new Date(2026, 5, 15),
            autoridad: "Seremi de Salud",
            resultado: "con_observaciones",
            local: "Los Robles",
            tenant_id: "t1",
          },
        ],
        descargos: [
          { id: "g1", titulo: "Descargo acta 12", estado: "abierto", created_at: new Date(2026, 5, 16), local: "Los Robles" },
        ],
      },
      { ahora, verSorpresas: false, verCobro: false }
    );
    const ids = eventos.map((evento) => evento.id);
    expect(ids).toEqual(
      expect.arrayContaining(["hallazgo-alta-a8f04228-4c11-4b2a-9d33-0e1f2a3b4c5d", "hallazgo-plazo-a8f04228-4c11-4b2a-9d33-0e1f2a3b4c5d", "fiscalizacion-f1", "descargo-g1"])
    );
    expect(eventos.find((e) => e.id === "fiscalizacion-f1")?.titulo).toBe("Los Robles · Seremi de Salud");
    expect(eventos.find((e) => e.id.startsWith("hallazgo-plazo-"))?.local).toBe("Los Robles");
  });

  it("marca como vencido lo que ya pasó dentro del mes", () => {
    const eventos = armarCalendario(
      { ...fuentes, documentos: [{ id: "d3", nombre: "Atrasado", vencimiento: new Date(2026, 5, 2) }] },
      { ahora, verSorpresas: false, verCobro: false }
    );
    expect(eventos.find((e) => e.id === "documento-d3")?.vencido).toBe(true);
  });
});

describe("grilla mensual", () => {
  it("junio 2026 parte en lunes 1 y llena 42 celdas", () => {
    const celdas = celdasDelMes(2026, 5);
    expect(celdas).toHaveLength(42);
    expect(celdas[0]).toMatchObject({ clave: "2026-06-01", dia: 1, fuera: false });
    expect(celdas[41].clave).toBe("2026-07-12");
  });

  it("octubre 2026 completa la primera semana con septiembre", () => {
    const celdas = celdasDelMes(2026, 9);
    expect(celdas[0]).toMatchObject({ clave: "2026-09-28", fuera: true });
    expect(celdas[3]).toMatchObject({ clave: "2026-10-01", fuera: false });
  });

  it("agrupa eventos por día en zona Chile", () => {
    const grupos = agruparPorDia([
      {
        id: "a",
        tipo: "visita",
        fecha: new Date("2026-11-20T15:00:00.000Z"),
        titulo: "Local A",
        vencido: false,
      },
    ]);
    expect(claveDia(new Date("2026-11-20T15:00:00.000Z"))).toBe("2026-11-20");
    expect(grupos.get("2026-11-20")?.map((e) => e.id)).toEqual(["a"]);
  });

  it("parsea YYYY-MM y cae al mes actual si viene inválido", () => {
    expect(parseMes("2026-11", ahora)).toEqual({ anio: 2026, mes: 10 });
    expect(parseMes("no-mes", ahora)).toEqual({ anio: 2026, mes: 5 });
  });
});

describe("proximosCobros", () => {
  it("salta al mes siguiente si el día ya pasó", () => {
    const [primero] = proximosCobros(5, ahora);
    expect(primero).toEqual(new Date(2026, 6, 5));
  });

  it("ajusta el día cuando el mes es más corto", () => {
    const [primero] = proximosCobros(31, new Date(2026, 1, 10));
    expect(primero).toEqual(new Date(2026, 1, 28));
  });
});
