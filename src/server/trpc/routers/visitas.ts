import { z } from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAsesor, requireAdmin } from "@/server/middleware/rbac";
import {
  itemEvaluacionSchema,
  noConformidadesDe,
  validarEvaluacion,
  TIPOS_VISITA,
} from "@/lib/bpm/visita";

const protectedProcedure = publicProcedure.use(withTenant);
const asesorProcedure = protectedProcedure.use(requireAsesor);
const adminLocalProcedure = protectedProcedure.use(requireAdmin);

export const visitasRouter = router({
  list: adminLocalProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.visita.findMany({
        where: { tenant_id: ctx.tenantActivo! },
        orderBy: { fecha: "desc" },
        take: input.limit,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          no_conformidades: {
            orderBy: { severidad: "asc" },
          },
        },
      });
    }),

  getById: adminLocalProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const visita = await ctx.prisma.visita.findUnique({
        where: { id: input.id },
        include: { no_conformidades: true },
      });
      if (!visita || visita.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Visita no encontrada." });
      }
      return visita;
    }),

  registrar: asesorProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        tipo: z.enum(TIPOS_VISITA),
        fecha: z.string().datetime(),
        hallazgos: z.string().trim().max(2000).optional(),
        evaluacion: z.array(itemEvaluacionSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const error = validarEvaluacion(input.tipo, input.evaluacion);
      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error });
      }

      const noConformidades = noConformidadesDe(input.evaluacion);
      const evaluacion = input.evaluacion.map((item) => ({
        area: item.area,
        resultado: item.resultado,
        ...(item.nota ? { nota: item.nota } : {}),
        ...(item.fecha_limite ? { fecha_limite: item.fecha_limite } : {}),
      }));
      return ctx.prisma.visita.create({
        data: {
          tenant_id: input.tenant_id,
          asesor_id: ctx.userId!,
          tipo: input.tipo,
          fecha: new Date(input.fecha),
          hallazgos: input.hallazgos || null,
          evaluacion: evaluacion as Prisma.InputJsonValue,
          no_conformidades: {
            create: noConformidades.map((nc) => ({
              area: nc.area,
              descripcion: nc.descripcion,
              severidad: nc.severidad,
              fecha_limite: nc.fecha_limite ? new Date(`${nc.fecha_limite}T12:00:00`) : undefined,
            })),
          },
        },
        include: { no_conformidades: true },
      });
    }),

  cerrarNC: adminLocalProcedure
    .input(
      z.object({
        nc_id: z.string().uuid(),
        evidencia: z.string().min(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const nc = await ctx.prisma.noConformidad.findUnique({
        where: { id: input.nc_id },
        include: { visita: true },
      });
      if (!nc || nc.visita.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No conformidad no encontrada.",
        });
      }
      return ctx.prisma.noConformidad.update({
        where: { id: input.nc_id },
        data: {
          estado: "cerrada",
          evidencia_cierre: input.evidencia ?? null,
          cerrada_at: new Date(),
        },
      });
    }),
});
