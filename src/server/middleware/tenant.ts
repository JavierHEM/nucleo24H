import { TRPCError } from "@trpc/server";
import { t } from "@/server/trpc/trpc";
import { exigirAsesorAsignado } from "@/server/middleware/asesor";

/**
 * Exige sesión y un local activo, y comprueba que el usuario pertenezca a ese local.
 * Los routers filtran por tenant en cada query. No se usa SET app.current_tenant:
 * Prisma entra como postgres y el pooler en modo transacción no conserva ese valor.
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

  if (ctx.userRole === "asesor") {
    await exigirAsesorAsignado(ctx, ctx.tenantActivo);
    return next({ ctx });
  }

  if (!ctx.tenants.includes(ctx.tenantActivo)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes acceso a este local.",
    });
  }

  return next({ ctx });
});
