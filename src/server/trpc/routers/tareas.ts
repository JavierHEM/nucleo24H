import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";

const protectedProcedure = publicProcedure.use(withTenant);
const adminProcedure = protectedProcedure.use(
  requireRole("jefe_local", "admin_local", "asesor", "admin_nucleo")
);

export const tareasRouter = router({
  /** Listar tareas activas del tenant con estado de completación de hoy */
  list: protectedProcedure
    .input(z.object({ fecha: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const fecha = input.fecha ? new Date(input.fecha) : new Date();
      const inicioDia = new Date(fecha);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(fecha);
      finDia.setHours(23, 59, 59, 999);

      const tareas = await ctx.prisma.tarea.findMany({
        where: { tenant_id: ctx.tenantActivo!, activa: true },
        orderBy: { orden: "asc" },
        include: {
          completaciones: {
            where: {
              fecha: { gte: inicioDia, lte: finDia },
            },
            select: {
              id: true,
              user_id: true,
              fecha: true,
              observacion: true,
            },
          },
        },
      });

      return tareas.map((t) => ({
        ...t,
        completadaHoy: t.completaciones.length > 0,
        completacion: t.completaciones[0] ?? null,
      }));
    }),

  /** Completar tarea del día */
  completar: protectedProcedure
    .input(
      z.object({
        tarea_id: z.string().uuid(),
        observacion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tarea = await ctx.prisma.tarea.findUnique({
        where: { id: input.tarea_id },
      });
      if (!tarea || tarea.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada." });
      }

      return ctx.prisma.tareaCompletacion.create({
        data: {
          tarea_id: input.tarea_id,
          user_id: ctx.userId!,
          observacion: input.observacion ?? null,
        },
      });
    }),

  /** Desmarcar tarea del día (solo hoy) */
  descompletar: protectedProcedure
    .input(z.object({ tarea_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);

      const completacion = await ctx.prisma.tareaCompletacion.findFirst({
        where: {
          tarea_id: input.tarea_id,
          user_id: ctx.userId!,
          fecha: { gte: inicioDia },
        },
      });

      if (!completacion) return null;

      return ctx.prisma.tareaCompletacion.delete({
        where: { id: completacion.id },
      });
    }),

  /** Crear tarea (admin_local o superior) */
  crear: adminProcedure
    .input(
      z.object({
        titulo: z.string().min(3, "Mínimo 3 caracteres"),
        descripcion: z.string().optional(),
        frecuencia: z.enum(["diaria", "semanal", "mensual"]).default("diaria"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.tarea.count({
        where: { tenant_id: ctx.tenantActivo! },
      });

      return ctx.prisma.tarea.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          titulo: input.titulo,
          descripcion: input.descripcion ?? null,
          frecuencia: input.frecuencia,
          orden: count,
        },
      });
    }),

  /** Archivar tarea */
  archivar: adminProcedure
    .input(z.object({ tarea_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tarea = await ctx.prisma.tarea.findUnique({
        where: { id: input.tarea_id },
      });
      if (!tarea || tarea.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada." });
      }
      return ctx.prisma.tarea.update({
        where: { id: input.tarea_id },
        data: { activa: false },
      });
    }),

  /** Resumen de completación del mes */
  resumenMes: adminProcedure
    .input(z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const [year, month] = input.mes.split("-").map(Number);
      const inicio = new Date(year, month - 1, 1);
      const fin = new Date(year, month, 0, 23, 59, 59);

      const tareas = await ctx.prisma.tarea.findMany({
        where: { tenant_id: ctx.tenantActivo!, activa: true },
        include: {
          completaciones: {
            where: { fecha: { gte: inicio, lte: fin } },
            select: { id: true, fecha: true },
          },
        },
      });

      const diasEnMes = fin.getDate();
      const totalEsperado = tareas.length * diasEnMes;
      const totalCompletadas = tareas.reduce(
        (sum, t) => sum + t.completaciones.length,
        0
      );

      return {
        porcentaje:
          totalEsperado > 0
            ? Math.round((totalCompletadas / totalEsperado) * 100)
            : 0,
        totalTareas: tareas.length,
        diasEnMes,
        totalCompletadas,
        totalEsperado,
      };
    }),
});
