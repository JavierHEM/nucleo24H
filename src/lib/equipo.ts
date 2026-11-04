import { agruparPorEmpresa } from "@/lib/empresas";

export type LocalEquipo = {
  id: string;
  nombre: string;
  rut: string;
  created_at: Date | string;
};

export type UsuarioEquipo = {
  id: string;
  nombre: string | null;
  email: string | null;
  rol: string;
  activo: boolean;
  created_at: Date | string;
};

export type VinculoEquipo = {
  user: UsuarioEquipo;
  local: LocalEquipo;
  origen: "miembro" | "asesor";
};

export type MiembroEmpresa = UsuarioEquipo & {
  origen: "miembro" | "asesor";
  locales: { id: string; nombre: string }[];
};

export type EmpresaEquipo = {
  rut: string;
  nombre: string;
  locales: { id: string; nombre: string }[];
  miembros: MiembroEmpresa[];
};

function localesUnicos(vinculos: VinculoEquipo[]): LocalEquipo[] {
  const porId = new Map<string, LocalEquipo>();
  for (const vinculo of vinculos) {
    if (!porId.has(vinculo.local.id)) {
      porId.set(vinculo.local.id, vinculo.local);
    }
  }
  return [...porId.values()];
}

function etiquetaPersona(user: UsuarioEquipo): string {
  return (user.nombre ?? user.email ?? "").toLocaleLowerCase("es");
}

/** Agrupa miembros y asesores por empresa (RUT). Un usuario en varias sucursales aparece una vez. */
export function agruparEquipoPorEmpresa(vinculos: VinculoEquipo[]): EmpresaEquipo[] {
  const grupos = agruparPorEmpresa(localesUnicos(vinculos));

  return grupos
    .map((grupo) => {
      const ids = new Set([grupo.casaCentral.id, ...grupo.sucursales.map((s) => s.id)]);
      const porUsuario = new Map<string, MiembroEmpresa>();

      for (const vinculo of vinculos) {
        if (!ids.has(vinculo.local.id)) continue;

        const actual = porUsuario.get(vinculo.user.id);
        const local = { id: vinculo.local.id, nombre: vinculo.local.nombre };

        if (!actual) {
          porUsuario.set(vinculo.user.id, {
            ...vinculo.user,
            origen: vinculo.origen,
            locales: [local],
          });
          continue;
        }

        if (!actual.locales.some((item) => item.id === local.id)) {
          actual.locales.push(local);
        }
        if (vinculo.origen === "miembro") {
          actual.origen = "miembro";
        }
      }

      const locales = [grupo.casaCentral, ...grupo.sucursales].map((local) => ({
        id: local.id,
        nombre: local.nombre,
      }));

      const miembros = [...porUsuario.values()]
        .map((miembro) => ({
          ...miembro,
          locales: [...miembro.locales].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
        }))
        .sort((a, b) => etiquetaPersona(a).localeCompare(etiquetaPersona(b), "es"));

      return {
        rut: grupo.casaCentral.rut,
        nombre: grupo.casaCentral.nombre,
        locales,
        miembros,
      };
    })
    .filter((empresa) => empresa.miembros.length > 0);
}
