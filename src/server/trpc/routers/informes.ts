import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { requireRole } from "@/server/middleware/rbac";

// Los informes consultan múltiples tenants a la vez — no requieren tenantActivo
const asesorProcedure = publicProcedure.use(requireRole("asesor", "admin_nucleo"));

export const informesRouter = router({
  /**
   * Devuelve todos los locales asignados al asesor autenticado con
   * el último sello emitido, conteo de registros del mes y NCs abiertas.
   */
  resumenLocales: asesorProcedure
    .input(z.object({ periodo: z.string().regex(/^\d{4}-\d{2}$/).optional() }))
    .query(async ({ ctx, input }) => {
      const periodo = input.periodo ?? new Date().toISOString().slice(0, 7);

      // Admin nucleo ve todos; asesor ve solo sus asignados
      let tenantIds: string[];
      if (ctx.userRole === "admin_nucleo") {
        const tenants = await ctx.prisma.tenant.findMany({
          where: { estado: "activo" },
          select: { id: true },
        });
        tenantIds = tenants.map((t) => t.id);
      } else {
        const asignaciones = await ctx.prisma.asignacionAsesor.findMany({
          where: { asesor_id: ctx.userId!, activo: true },
          select: { tenant_id: true },
        });
        tenantIds = asignaciones.map((a) => a.tenant_id);
      }

      if (tenantIds.length === 0) return [];

      const [tenants, sellos, registros, ncs] = await Promise.all([
        ctx.prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, nombre: true, ciudad: true, plan: true, estado: true },
          orderBy: { nombre: "asc" },
        }),
        ctx.prisma.sello.findMany({
          where: {
            tenant_id: { in: tenantIds },
            periodo,
          },
          select: {
            tenant_id: true,
            nivel: true,
            score_general: true,
            score_documentacion: true,
            score_condiciones: true,
            score_capacitaciones: true,
            score_tareas: true,
            emitido_at: true,
          },
        }),
        ctx.prisma.registro.groupBy({
          by: ["tenant_id"],
          where: {
            tenant_id: { in: tenantIds },
            created_at: {
              gte: new Date(`${periodo}-01`),
              lt: new Date(
                new Date(`${periodo}-01`).setMonth(
                  new Date(`${periodo}-01`).getMonth() + 1
                )
              ),
            },
          },
          _count: { id: true },
        }),
        ctx.prisma.noConformidad.groupBy({
          by: ["visita_id"],
          where: {
            cerrada_at: null,
            visita: { tenant_id: { in: tenantIds } },
          },
          _count: { id: true },
        }),
      ]);

      // Para NCs necesitamos mapear visita_id → tenant_id
      const visitaIds = ncs.map((n) => n.visita_id);
      const visitasTenantMap =
        visitaIds.length > 0
          ? await ctx.prisma.visita.findMany({
              where: { id: { in: visitaIds } },
              select: { id: true, tenant_id: true },
            })
          : [];

      const ncsPorTenant: Record<string, number> = {};
      for (const nc of ncs) {
        const visita = visitasTenantMap.find((v) => v.id === nc.visita_id);
        if (visita) {
          ncsPorTenant[visita.tenant_id] =
            (ncsPorTenant[visita.tenant_id] ?? 0) + nc._count.id;
        }
      }

      const selloMap = Object.fromEntries(sellos.map((s) => [s.tenant_id, s]));
      const registrosMap = Object.fromEntries(
        registros.map((r) => [r.tenant_id, r._count.id])
      );

      return tenants.map((t) => ({
        tenant: t,
        sello: selloMap[t.id] ?? null,
        registros_mes: registrosMap[t.id] ?? 0,
        ncs_abiertas: ncsPorTenant[t.id] ?? 0,
      }));
    }),

  /**
   * Historial de sellos de todos los locales para el período dado.
   * Útil para tendencias.
   */
  tendenciaSellos: asesorProcedure
    .input(
      z.object({
        meses: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      let tenantIds: string[];
      if (ctx.userRole === "admin_nucleo") {
        const tenants = await ctx.prisma.tenant.findMany({
          where: { estado: "activo" },
          select: { id: true },
        });
        tenantIds = tenants.map((t) => t.id);
      } else {
        const asignaciones = await ctx.prisma.asignacionAsesor.findMany({
          where: { asesor_id: ctx.userId!, activo: true },
          select: { tenant_id: true },
        });
        tenantIds = asignaciones.map((a) => a.tenant_id);
      }

      if (tenantIds.length === 0) return [];

      // Calcular períodos de los últimos N meses
      const periodos: string[] = [];
      const now = new Date();
      for (let i = 0; i < input.meses; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periodos.push(d.toISOString().slice(0, 7));
      }

      const sellos = await ctx.prisma.sello.findMany({
        where: {
          tenant_id: { in: tenantIds },
          periodo: { in: periodos },
        },
        select: {
          tenant_id: true,
          periodo: true,
          nivel: true,
          score_general: true,
        },
        orderBy: { periodo: "asc" },
      });

      return sellos;
    }),

  /**
   * Detalle de un local específico: historial de sellos + NCs + registros.
   */
  detalleLocal: asesorProcedure
    .input(z.object({ tenant_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verificar acceso
      if (ctx.userRole !== "admin_nucleo") {
        const asignacion = await ctx.prisma.asignacionAsesor.findUnique({
          where: {
            asesor_id_tenant_id: {
              asesor_id: ctx.userId!,
              tenant_id: input.tenant_id,
            },
          },
        });
        if (!asignacion?.activo) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No tienes acceso a este local.",
          });
        }
      }

      const [tenant, sellosHistorial, visitas, tareas] = await Promise.all([
        ctx.prisma.tenant.findUnique({
          where: { id: input.tenant_id },
          select: { id: true, nombre: true, ciudad: true, plan: true, estado: true, created_at: true },
        }),
        ctx.prisma.sello.findMany({
          where: { tenant_id: input.tenant_id },
          orderBy: { periodo: "desc" },
          take: 12,
        }),
        ctx.prisma.visita.findMany({
          where: { tenant_id: input.tenant_id },
          include: {
            no_conformidades: {
              select: { id: true, descripcion: true, severidad: true, cerrada_at: true },
            },
          },
          orderBy: { fecha: "desc" },
          take: 10,
        }),
        ctx.prisma.tarea.findMany({
          where: { tenant_id: input.tenant_id, activa: true },
          select: { id: true, titulo: true, frecuencia: true },
        }),
      ]);

      return { tenant, sellosHistorial, visitas, tareas };
    }),
});
