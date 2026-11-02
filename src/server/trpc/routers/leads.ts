import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { requireNucleo } from "@/server/middleware/rbac";

const nucleoProcedure = publicProcedure.use(requireNucleo);

export const leadsRouter = router({
  list: nucleoProcedure.query(async ({ ctx }) => {
    const [pendientes, atendidos] = await Promise.all([
      ctx.prisma.lead.findMany({ where: { atendido: false }, orderBy: { created_at: "desc" }, take: 100 }),
      ctx.prisma.lead.findMany({ where: { atendido: true }, orderBy: { created_at: "desc" }, take: 50 }),
    ]);
    const totalPendientes = await ctx.prisma.lead.count({ where: { atendido: false } });
    return { pendientes, atendidos, totalPendientes };
  }),

  marcarAtendido: nucleoProcedure
    .input(z.object({ id: z.string().uuid(), atendido: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.findUnique({ where: { id: input.id }, select: { id: true } });
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos esa solicitud." });
      }
      return ctx.prisma.lead.update({
        where: { id: input.id },
        data: { atendido: input.atendido },
      });
    }),
});
