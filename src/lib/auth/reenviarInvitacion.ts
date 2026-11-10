import { destinoTrasOnboarding } from "@/lib/auth/enlaceInvitacion";

export type RolInvitacion =
  | "admin_nucleo"
  | "asesor"
  | "admin_local"
  | "jefe_local"
  | "trabajador_local";

const ROLES_INVITACION = new Set<string>([
  "admin_nucleo",
  "asesor",
  "admin_local",
  "jefe_local",
  "trabajador_local",
]);

export function esRolInvitacion(rol: string): rol is RolInvitacion {
  return ROLES_INVITACION.has(rol);
}

export function puedeReenviarInvitacion(args: { activo: boolean; claveDefinida: boolean }) {
  return args.activo && !args.claveDefinida;
}

export function nextReenvioInvitacion(rol: RolInvitacion) {
  return destinoTrasOnboarding("/", rol);
}

/** Si el metadata apunta a un local del usuario, se usa ese; si no, el primero. */
export function tenantInvitacionLocal(
  metadataTenantId: string | null | undefined,
  vinculos: { id: string; nombre: string }[]
) {
  if (vinculos.length === 0) return null;
  if (metadataTenantId) {
    const coincidencia = vinculos.find((vinculo) => vinculo.id === metadataTenantId);
    if (coincidencia) return coincidencia;
  }
  return vinculos[0] ?? null;
}
