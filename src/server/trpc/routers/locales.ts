import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireNucleo, requireAsesor, requireRole } from "@/server/middleware/rbac";
import { puedeRemoverMiembro } from "@/lib/roles";
import { PLAN_IDS, TIPOS_LOCAL, normalizarPlan } from "@/lib/planes";
import { altaSuscripcionLocal } from "@/lib/locales/altaSuscripcion";
import { emailOpcional, emailOpcionalSchema, telefonoSchema } from "@/lib/locales/ficha";
import { invitarAdminLocal } from "@/server/locales/invitarAdminLocal";
import { syncUserClaims } from "@/lib/supabase/claims";
import { agruparEquipoPorEmpresa, type VinculoEquipo } from "@/lib/equipo";
import { claveRut } from "@/lib/empresas";

const INCLUDE_LOCAL = {
  _count: { select: { registros: true, sellos: true } },
  suscripcion: { select: { plan: true, hasta: true, estado: true, monto_clp: true } },
  empresa: {
    select: {
      id: true,
      razon_social: true,
      rut: true,
      telefono: true,
      email: true,
      giro: true,
      representante_legal_nombre: true,
    },
  },
} as const;

const nucleoProcedure = publicProcedure.use(requireNucleo);
const asesorProcedure = publicProcedure.use(withTenant).use(requireAsesor);

export const localesRouter = router({
  // Admin Núcleo: todos los locales
  list: nucleoProcedure
    .input(
      z.object({
        estado: z.enum(["pendiente", "activo", "suspendido", "baja"]).optional(),
        plan: z.enum(PLAN_IDS).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(500).default(20),
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
        include: INCLUDE_LOCAL,
      });
    }),

  porRut: nucleoProcedure
    .input(z.object({ rut: z.string().min(3).max(40) }))
    .query(async ({ ctx, input }) => {
      const clave = claveRut(input.rut);
      const locales = await ctx.prisma.tenant.findMany({
        include: INCLUDE_LOCAL,
        orderBy: { created_at: "asc" },
      });
      return locales.filter((local) => claveRut(local.rut) === clave);
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
        nombre: z.string().trim().min(2, "Ingresa el nombre del local").max(120).optional(),
        plan: z.enum(PLAN_IDS).optional(),
        tipo_local: z.enum(TIPOS_LOCAL).optional(),
        estado: z.enum(["activo", "suspendido", "baja"]).optional(),
        direccion: z.string().trim().max(200).optional(),
        ciudad: z.string().trim().min(2, "Ingresa la ciudad").max(80).optional(),
        telefono: z.string().trim().max(30).optional(),
        encargado_nombre: z.string().trim().max(120).nullable().optional(),
        encargado_telefono: z.string().trim().max(30).nullable().optional(),
        resolucion_sanitaria_presentada: z.boolean().optional(),
        patente_comercial_al_dia: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.estado === "activo") {
        const pagado = await ctx.prisma.pago.findFirst({
          where: { tenant_id: id, estado: "pagado" },
          select: { id: true },
        });
        if (!pagado) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Este local se habilita cuando se registra el pago de la suscripción.",
          });
        }
      }
      const local = await ctx.prisma.tenant.update({ where: { id }, data });
      if (data.plan) {
        await ctx.prisma.suscripcion.updateMany({ where: { tenant_id: id }, data: { plan: data.plan } });
      }
      return local;
    }),

  /**
   * Crea una sucursal: mismo RUT que la casa matriz, plan y suscripción propios.
   * Vincula a los dueños (admin_local) de la casa matriz.
   */
  crearSucursal: nucleoProcedure
    .input(
      z.object({
        casa_central_id: z.string().uuid(),
        nombre: z.string().min(2, "Ingresa el nombre de la sucursal"),
        direccion: z.string().min(3, "Ingresa la dirección"),
        ciudad: z.string().trim().min(2, "Ingresa la ciudad").max(80),
        telefono: telefonoSchema,
        tipo_local: z.enum(TIPOS_LOCAL).optional(),
        encargado_nombre: z.string().trim().max(120).optional(),
        encargado_telefono: z.string().trim().max(30).optional(),
        resolucion_sanitaria_presentada: z.boolean().default(false),
        patente_comercial_al_dia: z.boolean().default(false),
        plan: z.enum(PLAN_IDS),
        email_admin: emailOpcionalSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const casaCentral = await ctx.prisma.tenant.findUnique({
        where: { id: input.casa_central_id },
        include: {
          empresa: { select: { id: true, rut: true } },
          user_tenants: {
            include: { user: { select: { id: true, rol: true } } },
          },
          suscripcion: { select: { dia_cobro: true } },
        },
      });
      if (!casaCentral) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Local de origen no encontrado." });
      }

      const plan = normalizarPlan(input.plan);
      const alta = altaSuscripcionLocal({
        plan,
        diaCobro: casaCentral.suscripcion?.dia_cobro,
      });

      const sucursal = await ctx.prisma.$transaction(async (tx) => {
        const creada = await tx.tenant.create({
          data: {
            empresa_id: casaCentral.empresa_id,
            nombre: input.nombre,
            rut: casaCentral.empresa.rut,
            direccion: input.direccion,
            ciudad: input.ciudad,
            telefono: input.telefono,
            encargado_nombre: input.encargado_nombre,
            encargado_telefono: input.encargado_telefono,
            resolucion_sanitaria_presentada: input.resolucion_sanitaria_presentada,
            patente_comercial_al_dia: input.patente_comercial_al_dia,
            plan,
            tipo_local: input.tipo_local ?? casaCentral.tipo_local,
            estado: "pendiente",
          },
        });
        await tx.suscripcion.create({
          data: {
            tenant_id: creada.id,
            ...alta,
          },
        });
        const duenos = casaCentral.user_tenants.filter((ut) => ut.user.rol === "admin_local");
        if (duenos.length > 0) {
          await tx.userTenant.createMany({
            data: duenos.map((ut) => ({
              user_id: ut.user_id,
              tenant_id: creada.id,
            })),
            skipDuplicates: true,
          });
        }
        return creada;
      });

      const duenos = casaCentral.user_tenants.filter((ut) => ut.user.rol === "admin_local");
      for (const ut of duenos) {
        void syncUserClaims(ut.user_id).catch((err) => {
          console.error("[crearSucursal] Error sincronizando claims:", err);
        });
      }

      let invitacion: { message: string } | null = null;
      const emailAdmin = emailOpcional(input.email_admin);
      if (emailAdmin) {
        try {
          invitacion = await invitarAdminLocal({
            tenantId: sucursal.id,
            tenantNombre: sucursal.nombre,
            email: emailAdmin,
            invitadorId: ctx.userId,
          });
        } catch (error) {
          invitacion = {
            message:
              error instanceof Error
                ? `Sucursal creada. No se pudo invitar: ${error.message}`
                : "Sucursal creada. No se pudo enviar la invitación.",
          };
        }
      }

      return { sucursal, invitacion };
    }),

  asignarAsesor: nucleoProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        asesor_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asesor = await ctx.prisma.user.findFirst({
        where: { id: input.asesor_id, rol: "asesor", activo: true },
        select: { id: true },
      });
      if (!asesor) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El asesor no está activo.",
        });
      }

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

  /** Directorio global de personas por empresa (RUT). Solo admin_nucleo. */
  equipoPorEmpresa: nucleoProcedure.query(async ({ ctx }) => {
    const seleccionUsuario = {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      created_at: true,
    } as const;
    const seleccionLocal = {
      id: true,
      nombre: true,
      rut: true,
      created_at: true,
    } as const;

    const [membresias, asignaciones] = await Promise.all([
      ctx.prisma.userTenant.findMany({
        include: {
          user: { select: seleccionUsuario },
          tenant: { select: seleccionLocal },
        },
      }),
      ctx.prisma.asignacionAsesor.findMany({
        where: { activo: true },
        include: { tenant: { select: seleccionLocal } },
      }),
    ]);

    const asesorIds = [...new Set(asignaciones.map((a) => a.asesor_id))];
    const asesores = asesorIds.length
      ? await ctx.prisma.user.findMany({
          where: { id: { in: asesorIds } },
          select: seleccionUsuario,
        })
      : [];
    const porAsesor = new Map(asesores.map((usuario) => [usuario.id, usuario]));

    const vinculos: VinculoEquipo[] = [
      ...membresias.map((m) => ({
        user: m.user,
        local: m.tenant,
        origen: "miembro" as const,
      })),
      ...asignaciones.flatMap((asignacion) => {
        const usuario = porAsesor.get(asignacion.asesor_id);
        if (!usuario) return [];
        return [
          {
            user: usuario,
            local: asignacion.tenant,
            origen: "asesor" as const,
          },
        ];
      }),
    ];

    return agruparEquipoPorEmpresa(vinculos).map((empresa) => ({
      ...empresa,
      miembros: empresa.miembros.map((miembro) => ({
        ...miembro,
        created_at:
          miembro.created_at instanceof Date
            ? miembro.created_at.toISOString()
            : String(miembro.created_at),
      })),
    }));
  }),

  // Admin local: miembros de su propio tenant
  miEquipo: publicProcedure
    .use(withTenant)
    .use(requireRole("jefe_local", "admin_local", "admin_nucleo"))
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
    .use(requireRole("jefe_local", "admin_local", "admin_nucleo"))
    .input(z.object({ user_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const objetivo = await ctx.prisma.user.findUnique({
        where: { id: input.user_id },
        select: { rol: true },
      });

      if (
        !objetivo ||
        !puedeRemoverMiembro(ctx.userRole, objetivo.rol, input.user_id, ctx.userId!)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No puedes remover a este miembro del local.",
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
