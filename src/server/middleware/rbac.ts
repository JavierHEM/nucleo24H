import { TRPCError } from "@trpc/server";
import { t } from "@/server/trpc/trpc";
import type { UserRole } from "@/server/trpc/context";

/**
 * Guard de rol para procedimientos tRPC.
 * Pasar los roles que tienen PERMISO (whitelist).
 *
 * Jerarquía implícita:
 *   trabajador_local < jefe_local < admin_local < asesor < admin_nucleo
 *
 * Nunca asumir jerarquía — siempre declarar roles explícitamente.
 */
export const requireRole = (...allowedRoles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.userId || !ctx.userRole) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!allowedRoles.includes(ctx.userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Tu rol (${ctx.userRole}) no tiene permiso para esta acción.`,
      });
    }

    return next({ ctx: { ...ctx, userId: ctx.userId, userRole: ctx.userRole } });
  });

/** Cualquier usuario autenticado */
export const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.userRole) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId, userRole: ctx.userRole } });
});

/** Solo staff Nucleo 24H */
export const requireNucleo = requireRole("admin_nucleo");

/** Asesor o admin Núcleo */
export const requireAsesor = requireRole("asesor", "admin_nucleo");

/** Jefe o admin del local, asesor o admin Núcleo (excluye trabajador_local) */
export const requireAdmin = requireRole(
  "jefe_local",
  "admin_local",
  "asesor",
  "admin_nucleo"
);
