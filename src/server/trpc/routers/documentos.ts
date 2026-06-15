import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";

const protectedProcedure = publicProcedure.use(withTenant);
const asesorProcedure = protectedProcedure.use(
  requireRole("asesor", "admin_nucleo")
);

export const documentosRouter = router({
  list: protectedProcedure
    .input(z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/).optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.documento.findMany({
        where: {
          tenant_id: ctx.tenantActivo!,
          ...(input.mes ? { mes: input.mes } : {}),
        },
        orderBy: { created_at: "desc" },
      });
    }),

  subir: protectedProcedure
    .input(
      z.object({
        nombre: z.string().min(1),
        categoria: z.string().min(1),
        mes: z.string().regex(/^\d{4}-\d{2}$/),
        url: z.string().url(),
        vencimiento: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.documento.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          nombre: input.nombre,
          categoria: input.categoria,
          mes: input.mes,
          url: input.url,
          vencimiento: input.vencimiento
            ? new Date(input.vencimiento)
            : undefined,
          created_by: ctx.userId!,
        },
      });
    }),

  revisar: asesorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        estado: z.enum(["aprobado", "observado", "rechazado"]),
        observacion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.documento.findUnique({
        where: { id: input.id },
      });
      if (!doc || doc.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento no encontrado.",
        });
      }
      return ctx.prisma.documento.update({
        where: { id: input.id },
        data: { estado: input.estado, observacion: input.observacion },
      });
    }),
});
