import { describe, expect, it } from "vitest";
import { agruparEquipoPorEmpresa, type VinculoEquipo } from "@/lib/equipo";
import { claveRut } from "@/lib/empresas";

function local(
  id: string,
  nombre: string,
  rut: string,
  created_at: string
): VinculoEquipo["local"] {
  return { id, nombre, rut, created_at };
}

function user(
  id: string,
  nombre: string,
  rol: string
): VinculoEquipo["user"] {
  return {
    id,
    nombre,
    email: `${id}@local.cl`,
    rol,
    activo: true,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("agruparEquipoPorEmpresa", () => {
  it("une sucursales del mismo RUT y no duplica a la persona", () => {
    const casa = local("casa", "Los Alerces", "76.111.111-1", "2025-01-01T00:00:00.000Z");
    const sucursal = local("suc", "Los Alerces 2", "76111111-1", "2025-06-01T00:00:00.000Z");
    const ana = user("ana", "Ana Pérez", "jefe_local");

    const empresas = agruparEquipoPorEmpresa([
      { user: ana, local: casa, origen: "miembro" },
      { user: ana, local: sucursal, origen: "miembro" },
    ]);

    expect(empresas).toHaveLength(1);
    expect(claveRut(empresas[0].rut)).toBe("76111111-1");
    expect(empresas[0].nombre).toBe("Los Alerces");
    expect(empresas[0].locales.map((l) => l.id).sort()).toEqual(["casa", "suc"]);
    expect(empresas[0].miembros).toHaveLength(1);
    expect(empresas[0].miembros[0].locales.map((l) => l.nombre)).toEqual([
      "Los Alerces",
      "Los Alerces 2",
    ]);
  });

  it("separa usuarios de empresas distintas", () => {
    const empresas = agruparEquipoPorEmpresa([
      {
        user: user("a", "Ana", "admin_local"),
        local: local("1", "Empresa A", "11.111.111-1", "2025-01-01T00:00:00.000Z"),
        origen: "miembro",
      },
      {
        user: user("b", "Bruno", "trabajador_local"),
        local: local("2", "Empresa B", "22.222.222-2", "2025-01-01T00:00:00.000Z"),
        origen: "miembro",
      },
    ]);

    expect(empresas.map((e) => e.nombre)).toEqual(["Empresa A", "Empresa B"]);
    expect(empresas[0].miembros[0].nombre).toBe("Ana");
    expect(empresas[1].miembros[0].nombre).toBe("Bruno");
  });

  it("incluye asesores asignados y privilegia el vínculo de miembro", () => {
    const localA = local("1", "Local A", "11.111.111-1", "2025-01-01T00:00:00.000Z");
    const carmen = user("c", "Carmen", "asesor");

    const empresas = agruparEquipoPorEmpresa([
      { user: carmen, local: localA, origen: "asesor" },
      { user: carmen, local: localA, origen: "miembro" },
    ]);

    expect(empresas[0].miembros).toHaveLength(1);
    expect(empresas[0].miembros[0].origen).toBe("miembro");
    expect(empresas[0].miembros[0].locales).toHaveLength(1);
  });

  it("repite a la persona si pertenece a dos RUT distintos", () => {
    const maria = user("m", "María", "jefe_local");
    const empresas = agruparEquipoPorEmpresa([
      {
        user: maria,
        local: local("1", "Empresa A", "11.111.111-1", "2025-01-01T00:00:00.000Z"),
        origen: "miembro",
      },
      {
        user: maria,
        local: local("2", "Empresa B", "22.222.222-2", "2025-01-01T00:00:00.000Z"),
        origen: "miembro",
      },
    ]);

    expect(empresas).toHaveLength(2);
    expect(empresas.every((e) => e.miembros[0].id === "m")).toBe(true);
  });
});
