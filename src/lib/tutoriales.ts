import { ETIQUETA_ROL } from "@/lib/roles";

export const MAX_VIDEO_TUTORIAL_MB = 80;
export const TIPOS_VIDEO_TUTORIAL = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const ROLES_TUTORIAL = [
  "trabajador_local",
  "jefe_local",
  "admin_local",
  "asesor",
  "admin_nucleo",
] as const;

export type RolTutorial = (typeof ROLES_TUTORIAL)[number];

export function esTipoVideoTutorial(tipo: string): boolean {
  return (TIPOS_VIDEO_TUTORIAL as readonly string[]).includes(tipo);
}

export function esRolTutorial(rol: string): rol is RolTutorial {
  return (ROLES_TUTORIAL as readonly string[]).includes(rol);
}

export function etiquetaRolesTutorial(roles: readonly string[]): string {
  if (roles.length === 0) return "Sin roles";
  return roles
    .filter(esRolTutorial)
    .map((rol) => ETIQUETA_ROL[rol]?.label ?? rol)
    .join(" · ");
}

export function puedeVerTutorial(args: {
  rol: string | null | undefined;
  activo: boolean;
  roles: readonly string[];
}): boolean {
  if (!args.rol) return false;
  if (!args.activo && args.rol !== "admin_nucleo") return false;
  if (args.rol === "admin_nucleo") return true;
  return args.roles.includes(args.rol);
}
