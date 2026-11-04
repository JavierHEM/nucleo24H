export const ROLES_INVITABLES = [
  "trabajador_local",
  "jefe_local",
  "admin_local",
] as const;

export type RolInvitable = (typeof ROLES_INVITABLES)[number];

const RANGO: Record<string, number> = {
  trabajador_local: 1,
  jefe_local: 2,
  admin_local: 3,
  asesor: 4,
  admin_nucleo: 5,
};

export function puedeGestionarEquipo(rol: string | null | undefined): boolean {
  return rol === "jefe_local" || rol === "admin_local" || rol === "admin_nucleo";
}

export function puedeAsignarCargos(rol: string | null | undefined): boolean {
  return rol === "admin_local" || rol === "admin_nucleo";
}

export function puedeOperarLocal(rol: string | null | undefined): boolean {
  return rol === "jefe_local" || rol === "admin_local" || rol === "admin_nucleo";
}

export function puedeCargarPlanilla(rol: string | null | undefined): boolean {
  return rol === "trabajador_local" || puedeOperarLocal(rol);
}

export function puedeAdjuntarHallazgo(rol: string | null | undefined): boolean {
  return (
    rol === "trabajador_local" ||
    rol === "jefe_local" ||
    rol === "admin_local" ||
    rol === "asesor" ||
    rol === "admin_nucleo"
  );
}

export function puedeAdjuntarProveedor(rol: string | null | undefined): boolean {
  return puedeAdjuntarHallazgo(rol);
}

export function puedeInvitarConRol(
  actor: string | null | undefined,
  objetivo: string
): objetivo is RolInvitable {
  if (
    objetivo !== "trabajador_local" &&
    objetivo !== "jefe_local" &&
    objetivo !== "admin_local"
  ) {
    return false;
  }
  if (actor === "jefe_local") return objetivo === "trabajador_local";
  return actor === "admin_local" || actor === "admin_nucleo";
}

export function debePromoverRol(actual: string, siguiente: string): boolean {
  return (RANGO[siguiente] ?? 0) > (RANGO[actual] ?? 0);
}

export function esContactoLocal(rol: string): boolean {
  return rol === "admin_local" || rol === "jefe_local";
}

export function puedeRemoverMiembro(
  actor: string | null | undefined,
  targetRol: string,
  targetId: string,
  selfId: string
): boolean {
  if (targetId === selfId) return false;
  if (actor === "admin_nucleo") return true;
  if (actor === "admin_local") return targetRol !== "admin_nucleo";
  if (actor === "jefe_local") return targetRol === "trabajador_local";
  return false;
}

export function esRolGestion(rol: string | null | undefined): boolean {
  return (
    rol === "jefe_local" ||
    rol === "admin_local" ||
    rol === "asesor" ||
    rol === "admin_nucleo"
  );
}

export const ETIQUETA_ROL: Record<string, { label: string; className: string }> = {
  admin_local: { label: "Admin local", className: "bg-[#16294A] text-white" },
  jefe_local: { label: "Jefe de local", className: "bg-[#16294A]/10 text-[#16294A]" },
  trabajador_local: { label: "Trabajador", className: "bg-[#E5F1E3] text-[#255620]" },
  asesor: { label: "Asesor", className: "bg-[#E8EEF5] text-[#16294A]" },
  admin_nucleo: { label: "Admin Núcleo", className: "bg-[#F4F6F3] text-[#0B1B33]" },
};
