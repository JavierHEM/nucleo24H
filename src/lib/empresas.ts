export function claveRut(rut: string): string {
  return rut.replace(/[.\s]/g, "").toUpperCase();
}

type LocalAgrupable = {
  id: string;
  nombre: string;
  rut: string;
  created_at: Date | string;
};

export type GrupoEmpresa<T extends LocalAgrupable> = {
  rut: string;
  casaCentral: T;
  sucursales: T[];
};

/** Agrupa locales por RUT. El más antiguo de cada grupo es la casa central. */
export function agruparPorEmpresa<T extends LocalAgrupable>(
  locales: T[]
): GrupoEmpresa<T>[] {
  const porRut = new Map<string, T[]>();

  for (const local of locales) {
    const clave = claveRut(local.rut);
    const grupo = porRut.get(clave) ?? [];
    grupo.push(local);
    porRut.set(clave, grupo);
  }

  return [...porRut.values()]
    .map((grupo) => {
      const ordenados = [...grupo].sort((a, b) => {
        const delta =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (delta !== 0) return delta;
        return a.id.localeCompare(b.id);
      });
      return {
        rut: ordenados[0].rut,
        casaCentral: ordenados[0],
        sucursales: ordenados.slice(1),
      };
    })
    .sort((a, b) =>
      a.casaCentral.nombre.localeCompare(b.casaCentral.nombre, "es")
    );
}
