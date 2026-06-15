import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";

const protectedProcedure = publicProcedure.use(withTenant);

const TipoRegistro = z.enum(["temperatura", "limpieza", "plagas", "capacitacion"]);

export const registrosRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        tipo: TipoRegistro.optional(),
        desde: z.string().datetime().optional(),
        hasta: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.registro.findMany({
        where: {
          tenant_id: ctx.tenantActivo!,
          ...(input.tipo ? { tipo: input.tipo } : {}),
          ...(input.desde || input.hasta
            ? {
                fecha: {
                  ...(input.desde ? { gte: new Date(input.desde) } : {}),
                  ...(input.hasta ? { lte: new Date(input.hasta) } : {}),
                },
              }
            : {}),
        },
        orderBy: { fecha: "desc" },
        take: input.limit,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
    }),

  crear: protectedProcedure
    .input(
      z.object({
        tipo: TipoRegistro,
        fecha: z.string().datetime(),
        datos: z.record(z.string(), z.unknown()),
        adjunto_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.registro.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          tipo: input.tipo,
          fecha: new Date(input.fecha),
          // Prisma 7 espera JsonValue — se hace cast seguro desde el input validado por Zod
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          datos: input.datos as any,
          adjunto_url: input.adjunto_url,
          created_by: ctx.userId!,
        },
      });
    }),
});
