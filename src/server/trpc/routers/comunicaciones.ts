import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";

const protectedProcedure = publicProcedure
  .use(withTenant)
  .use(requireRole("admin_local", "asesor", "admin_nucleo"));

export const comunicacionesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        soloNoLeidos: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      // Mostrar mensajes enviados Y recibidos para una vista de conversación
      return ctx.prisma.mensaje.findMany({
        where: {
          tenant_id: ctx.tenantActivo!,
          OR: [{ para: ctx.userId! }, { de: ctx.userId! }],
          ...(input.soloNoLeidos ? { leido: false, para: ctx.userId! } : {}),
        },
        include: {
          remitente: { select: { nombre: true, email: true } },
          destinatario: { select: { nombre: true, email: true } },
        },
        orderBy: { created_at: "asc" },
        take: input.limit,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
    }),

  enviar: protectedProcedure
    .input(
      z.object({
        para: z.string().uuid(),
        contenido: z.string().min(1).max(2000),
        adjunto_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.mensaje.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          de: ctx.userId!,
          para: input.para,
          contenido: input.contenido,
          adjunto_url: input.adjunto_url,
        },
      });
    }),

  marcarLeido: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.mensaje.updateMany({
        where: { id: input.id, para: ctx.userId!, tenant_id: ctx.tenantActivo! },
        data: { leido: true },
      });
    }),

  // Sin withTenant — retorna 0 si no hay tenant activo, nunca falla
  contadorNoLeidos: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantActivo || !ctx.userId) return 0;
    return ctx.prisma.mensaje.count({
      where: { tenant_id: ctx.tenantActivo, para: ctx.userId, leido: false },
    });
  }),

  marcarTodosLeidos: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.mensaje.updateMany({
      where: { tenant_id: ctx.tenantActivo!, para: ctx.userId!, leido: false },
      data: { leido: true },
    });
  }),

  /**
   * Devuelve los contactos disponibles para enviar mensajes:
   * - admin_local/trabajador_local → asesor asignado al tenant
   * - asesor/admin_nucleo → admins del tenant activo
   */
  getContactos: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.userRole;

    if (role === "asesor" || role === "admin_nucleo") {
      const miembros = await ctx.prisma.userTenant.findMany({
        where: { tenant_id: ctx.tenantActivo! },
        include: {
          user: { select: { id: true, nombre: true, email: true, rol: true } },
        },
      });
      return miembros
        .filter((m) => m.user.rol === "admin_local" && m.user_id !== ctx.userId)
        .map((m) => ({ id: m.user.id, nombre: m.user.nombre ?? m.user.email ?? "", rol: m.user.rol }));
    }

    // admin_local → asesor asignado
    const asignacion = await ctx.prisma.asignacionAsesor.findFirst({
      where: { tenant_id: ctx.tenantActivo!, activo: true },
      select: { asesor_id: true },
    });
    if (!asignacion) return [];

    const asesor = await ctx.prisma.user.findUnique({
      where: { id: asignacion.asesor_id },
      select: { id: true, nombre: true, email: true, rol: true },
    });
    if (!asesor) return [];
    return [{ id: asesor.id, nombre: asesor.nombre ?? asesor.email ?? "", rol: asesor.rol }];
  }),
});
