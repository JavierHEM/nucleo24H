import { TRPCError } from "@trpc/server";
import { t } from "@/server/trpc/trpc";
import { suscripcionEscribible } from "@/lib/payments/mora";

export const requireSuscripcionEscribible = t.middleware(async ({ ctx, next }) => {
  if (!ctx.tenantActivo) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No hay un local activo." });
  }
  if (ctx.userRole === "asesor" || ctx.userRole === "admin_nucleo") {
    return next();
  }
  const suscripcion = await ctx.prisma.suscripcion.findUnique({
    where: { tenant_id: ctx.tenantActivo },
    select: { estado: true, acceso_hasta: true },
  });
  if (
    suscripcion &&
    !suscripcionEscribible({ estado: suscripcion.estado, accesoHasta: suscripcion.acceso_hasta })
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "La cuenta está en solo lectura. Puedes ver y descargar el historial, pero no ingresar registros ni cerrar hallazgos hasta regularizar el pago.",
    });
  }
  return next();
});
