import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { DECLARACIONES, DECLARACIONES_VERSION } from "@/lib/declaraciones/textos";
import { RECURSOS_CONSTANCIA } from "@/lib/declaraciones/constancia";
import { constanciasDeRecurso } from "@/server/declaraciones/deRecurso";

const protectedProcedure = publicProcedure.use(withTenant);

export const declaracionesRouter = router({
  deRecurso: protectedProcedure
    .input(
      z.object({
        recurso_tipo: z.enum(RECURSOS_CONSTANCIA),
        recurso_id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantActivo) throw new TRPCError({ code: "BAD_REQUEST", message: "Sin local activo." });
      return constanciasDeRecurso(ctx.prisma, ctx.tenantActivo, input.recurso_tipo, input.recurso_id);
    }),

  aceptarD: protectedProcedure.input(z.object({ acepta: z.literal(true) })).mutation(async ({ ctx }) => {
    const existente = await ctx.prisma.declaracionVeracidad.findFirst({
      where: { tenant_id: ctx.tenantActivo!, tipo: "D" },
    });
    if (existente) return existente;
    return ctx.prisma.declaracionVeracidad.create({
      data: {
        tenant_id: ctx.tenantActivo!,
        user_id: ctx.userId!,
        tipo: "D",
        version: DECLARACIONES_VERSION,
        texto: DECLARACIONES.D.texto,
        evento: "aceptacion_servicio",
      },
    });
  }),

  pendienteD: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantActivo) throw new TRPCError({ code: "BAD_REQUEST", message: "Sin local activo." });
    const d = await ctx.prisma.declaracionVeracidad.findFirst({
      where: { tenant_id: ctx.tenantActivo, tipo: "D" },
      select: { id: true },
    });
    return { pendiente: !d };
  }),
});
