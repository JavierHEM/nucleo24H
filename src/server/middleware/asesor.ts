import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "@/server/trpc/context";

type ContextoAsesor = Pick<TRPCContext, "prisma" | "userId" | "userRole">;

/** Los asesores solo operan sobre locales con asignación activa; admin_nucleo no está restringido. */
export async function exigirAsesorAsignado(ctx: ContextoAsesor, tenantId: string): Promise<void> {
  if (ctx.userRole !== "asesor") return;

  const asignacion = await ctx.prisma.asignacionAsesor.findFirst({
    where: { tenant_id: tenantId, asesor_id: ctx.userId!, activo: true },
    select: { id: true },
  });
  if (!asignacion) {
    console.warn("[asesor] Operación sobre un local sin asignación", { userId: ctx.userId, tenantId });
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes asignado este local." });
  }
}
