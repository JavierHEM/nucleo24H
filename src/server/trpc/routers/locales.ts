import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireNucleo, requireAsesor, requireRole } from "@/server/middleware/rbac";
import { syncUserClaims } from "@/lib/supabase/claims";

const nucleoProcedure = publicProcedure.use(withTenant).use(requireNucleo);
const asesorProcedure = publicProcedure.use(withTenant).use(requireAsesor);

export const localesRouter = router({
  // Admin Núcleo: todos los locales
  list: nucleoProcedure
    .input(
      z.object({
        estado: z.enum(["activo", "suspendido", "baja"]).optional(),
        plan: z.enum(["calidad", "integral"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.tenant.findMany({
        where: {
          ...(input.estado ? { estado: input.estado } : {}),
          ...(input.plan ? { plan: input.plan } : {}),
          ...(input.search
            ? {
                OR: [
                  { nombre: { contains: input.search, mode: "insensitive" } },
                  { rut: { contains: input.search } },
                ],
              }
            : {}),
        },
        orderBy: { nombre: "asc" },
        take: input.limit,
        include: {
          _count: { select: { registros: true, sellos: true } },
        },
      });
    }),

  getById: nucleoProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const local = await ctx.prisma.tenant.findUnique({
        where: { id: input.id },
        include: {
          sellos: { orderBy: { periodo: "desc" }, take: 6 },
          _count: { select: { registros: true, documentos: true, visitas: true } },
          asignaciones: {
            where: { activo: true },
            include: { tenant: { select: { nombre: true } } },
          },
        },
      });
      if (!local) throw new TRPCError({ code: "NOT_FOUND", message: "Local no encontrado." });
      return local;
    }),

  actualizar: nucleoProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        nombre: z.string().min(2).optional(),
        plan: z.enum(["calidad", "integral"]).optional(),
        estado: z.enum(["activo", "suspendido", "baja"]).optional(),
        direccion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.tenant.update({ where: { id }, data });
    }),

  /**
   * Crea una sucursal a partir de un local existente (casa central):
   * hereda RUT, plan y ciudad, y vincula a los mismos dueños (admin_local).
   */
  crearSucursal: nucleoProcedure
    .input(
      z.object({
        casa_central_id: z.string().uuid(),
        nombre: z.string().min(2, "Ingresa el nombre de la sucursal"),
        direccion: z.string().min(3, "Ingresa la dirección"),
        plan: z.enum(["calidad", "integral"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const casaCentral = await ctx.prisma.tenant.findUnique({
        where: { id: input.casa_central_id },
        include: {
          user_tenants: {
            include: { user: { select: { id: true, rol: true } } },
          },
        },
      });
      if (!casaCentral) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Local de origen no encontrado." });
      }

      const sucursal = await ctx.prisma.tenant.create({
        data: {
          nombre: input.nombre,
          rut: casaCentral.rut,
          direccion: input.direccion,
          ciudad: casaCentral.ciudad,
          plan: input.plan ?? casaCentral.plan,
          estado: "activo",
        },
      });

      // Vincular a los dueños de la casa central
      const duenos = casaCentral.user_tenants.filter(
        (ut) => ut.user.rol === "admin_local"
      );
      if (duenos.length > 0) {
        await ctx.prisma.userTenant.createMany({
          data: duenos.map((ut) => ({
            user_id: ut.user_id,
            tenant_id: sucursal.id,
          })),
          skipDuplicates: true,
        });
        // Actualizar claims del JWT de cada dueño (fire & forget)
        for (const ut of duenos) {
          void syncUserClaims(ut.user_id).catch((err) => {
            console.error("[crearSucursal] Error sincronizando claims:", err);
          });
        }
      }

      return sucursal;
    }),

  asignarAsesor: nucleoProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        asesor_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.asignacionAsesor.upsert({
        where: {
          asesor_id_tenant_id: {
            asesor_id: input.asesor_id,
            tenant_id: input.tenant_id,
          },
        },
        create: {
          asesor_id: input.asesor_id,
          tenant_id: input.tenant_id,
          activo: true,
        },
        update: { activo: true },
      });
    }),

  // Admin local: miembros de su propio tenant
  miEquipo: publicProcedure
    .use(withTenant)
    .use(requireRole("admin_local", "admin_nucleo"))
    .query(async ({ ctx }) => {
      const miembros = await ctx.prisma.userTenant.findMany({
        where: { tenant_id: ctx.tenantActivo! },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
              rol: true,
              activo: true,
              created_at: true,
            },
          },
        },
        orderBy: { user: { nombre: "asc" } },
      });
      return miembros.map((m) => m.user);
    }),

  // Admin local: remover miembro del tenant
  removerMiembro: publicProcedure
    .use(withTenant)
    .use(requireRole("admin_local", "admin_nucleo"))
    .input(z.object({ user_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // No puede removerse a sí mismo
      if (input.user_id === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No puedes removerte a ti mismo del local.",
        });
      }

      await ctx.prisma.userTenant.deleteMany({
        where: {
          user_id: input.user_id,
          tenant_id: ctx.tenantActivo!,
        },
      });

      // Sincronizar claims (fire & forget)
      void syncUserClaims(input.user_id).catch((err) => {
        console.error("[removerMiembro] Error sincronizando claims:", err);
      });

      return { ok: true };
    }),

  // Asesor: sus locales asignados
  misLocalesAsignados: asesorProcedure.query(async ({ ctx }) => {
    return ctx.prisma.asignacionAsesor.findMany({
      where: { asesor_id: ctx.userId!, activo: true },
      include: {
        tenant: {
          include: {
            sellos: { orderBy: { periodo: "desc" }, take: 1 },
          },
        },
      },
    });
  }),
});
