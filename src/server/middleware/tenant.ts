import { TRPCError } from "@trpc/server";
import { t } from "@/server/trpc/trpc";

/**
 * Inyecta app.current_tenant en la sesión PostgreSQL.
 * Debe ejecutarse ANTES de cualquier query que use RLS.
 *
 * Para admin_nucleo no hay restricción de tenant — puede ver todo.
 * Para asesor se usa el tenantActivo del contexto (el local que está visitando).
 */
export const withTenant = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.tenantActivo) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No hay un local activo seleccionado.",
    });
  }

  // admin_nucleo bypasea la verificación de pertenencia al tenant
  if (ctx.userRole === "admin_nucleo") {
    return next({ ctx });
  }

  // Verificar que el usuario tenga acceso al tenant activo
  // (para asesor, su tenant_activo debe estar en AsignacionAsesor)
  if (ctx.userRole !== "asesor" && !ctx.tenants.includes(ctx.tenantActivo)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes acceso a este local.",
    });
  }

  await ctx.prisma.$executeRawUnsafe(
    `SET app.current_tenant = '${ctx.tenantActivo}'`
  );

  return next({ ctx });
});
