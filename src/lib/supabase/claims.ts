import { createAdminClient } from "./admin";
import { prisma } from "@/server/db/prisma";

/**
 * Sincroniza app_metadata (rol + tenants) del usuario en Supabase Auth
 * con el estado real de la BD. Llamar después de cualquier cambio en
 * UserTenant o User.rol para que el fast-path del contexto tRPC y
 * /api/tenant/switch vean los claims actualizados.
 */
export async function syncUserClaims(userId: string): Promise<void> {
  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { rol: true } }),
    prisma.userTenant.findMany({
      where: { user_id: userId },
      select: { tenant_id: true },
    }),
  ]);

  if (!user) {
    console.error("[syncUserClaims] User no encontrado:", userId);
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      rol: user.rol,
      tenants: memberships.map((m) => m.tenant_id),
    },
  });

  if (error) {
    console.error("[syncUserClaims] Error actualizando claims:", error);
  }
}
