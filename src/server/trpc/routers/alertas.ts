import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";

const protectedProcedure = publicProcedure.use(withTenant);
const DIA_MS = 86_400_000;
export const DIAS_OCULTAR_ALERTA_RESUELTA = 7;

export const alertasRouter = router({
  resolver: protectedProcedure
    .input(z.object({ alerta_key: z.string().min(2).max(80), nota: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.alertaResolucion.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          alerta_key: input.alerta_key,
          actor_id: ctx.userId!,
          nota: input.nota,
        },
      });
    }),
});

export function alertaAunVisible(
  ultimaResolucion: Date | undefined,
  ahora: Date,
  dias = DIAS_OCULTAR_ALERTA_RESUELTA
): boolean {
  if (!ultimaResolucion) return true;
  return ahora.getTime() - ultimaResolucion.getTime() > dias * DIA_MS;
}
