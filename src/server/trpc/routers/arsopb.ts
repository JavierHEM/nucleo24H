import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";

const protectedProcedure = publicProcedure.use(withTenant);
const adminProcedure = protectedProcedure.use(requireRole("admin_nucleo"));

const TipoDerecho = z.enum([
  "acceso",
  "rectificacion",
  "supresion",
  "oposicion",
  "portabilidad",
  "bloqueo",
]);

// Art. 5, 6, 7, 9, 12 — derechos del titular Ley 21.719
export const arsopbRouter = router({
  // RF-58: Derecho de acceso — vista "Mis datos"
  misDatos: protectedProcedure.query(async ({ ctx }) => {
    const [user, registros, documentos, consentimientos] = await Promise.all([
      ctx.prisma.user.findUnique({ where: { id: ctx.userId! } }),
      ctx.prisma.registro.findMany({
        where: { tenant_id: ctx.tenantActivo! },
        select: { id: true, tipo: true, fecha: true, created_at: true },
      }),
      ctx.prisma.documento.findMany({
        where: { tenant_id: ctx.tenantActivo! },
        select: { id: true, nombre: true, categoria: true, created_at: true },
      }),
      ctx.prisma.consentimiento.findMany({
        where: { titular_id: ctx.userId! },
        orderBy: { timestamp_evento: "desc" },
      }),
    ]);
    return { user, registros, documentos, consentimientos };
  }),

  // RF-59: Portabilidad — exportar datos del usuario (Ley 21.719 Art.7)
  exportarDatos: protectedProcedure.query(async ({ ctx }) => {
    const [user, tenants] = await Promise.all([
      ctx.prisma.user.findUnique({ where: { id: ctx.userId! } }),
      ctx.prisma.userTenant.findMany({
        where: { user_id: ctx.userId! },
        include: { tenant: { select: { nombre: true, rut: true, ciudad: true } } },
      }),
    ]);
    return { user, tenants: tenants.map((ut) => ut.tenant) };
  }),

  // RF-60: Rectificación / RF-61: Supresión / RF-56: Revocación
  solicitarDerecho: protectedProcedure
    .input(
      z.object({
        tipo_derecho: TipoDerecho,
        detalle: z.string().min(10).max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fechaIngreso = new Date();
      const fechaLimite = new Date(fechaIngreso);
      fechaLimite.setDate(fechaLimite.getDate() + 30); // Art. 6° — 30 días corridos

      return ctx.prisma.solicitudArsopb.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          titular_id: ctx.userId!,
          tipo_derecho: input.tipo_derecho,
          descripcion: input.detalle,
          estado: "pendiente",
          fecha_ingreso: fechaIngreso,
          fecha_limite: fechaLimite,
        },
      });
    }),

  // RF-56: Revocación de consentimiento (Art. 12)
  revocarConsentimiento: protectedProcedure
    .input(z.object({ ip_origen: z.string().min(7).max(45) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.consentimiento.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          titular_id: ctx.userId!,
          tipo: "revocacion",
          documento_version: "v2.0",
          timestamp_evento: new Date(),
          ip_origen: input.ip_origen,
          canal: "web",
        },
      });
    }),

  // RF-63: Panel ARSOPB para Admin Núcleo Sur
  panelAdmin: adminProcedure
    .input(
      z.object({
        estado: z
          .enum(["pendiente", "en_revision", "resuelta", "rechazada"])
          .optional(),
        proximas_a_vencer: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const hoy = new Date();
      const en48h = new Date(hoy.getTime() + 48 * 60 * 60 * 1000);

      return ctx.prisma.solicitudArsopb.findMany({
        where: {
          ...(input.estado ? { estado: input.estado } : {}),
          ...(input.proximas_a_vencer
            ? { fecha_limite: { lte: en48h }, estado: "pendiente" }
            : {}),
        },
        orderBy: { fecha_limite: "asc" },
        include: { tenant: { select: { nombre: true } } },
      });
    }),

  resolverSolicitud: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        estado: z.enum(["resuelta", "rechazada"]),
        resolucion: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const solicitud = await ctx.prisma.solicitudArsopb.findUnique({
        where: { id: input.id },
      });
      if (!solicitud) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Solicitud no encontrada.",
        });
      }
      return ctx.prisma.solicitudArsopb.update({
        where: { id: input.id },
        data: {
          estado: input.estado,
          resolucion: input.resolucion,
          respondida_por: ctx.userId!,
          fecha_respuesta: new Date(),
        },
      });
    }),

  /** Alias para el panel admin con campos más descriptivos */
  resolver: adminProcedure
    .input(
      z.object({
        solicitud_id: z.string().uuid(),
        accion: z.enum(["atendido", "rechazado"]),
        respuesta: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const solicitud = await ctx.prisma.solicitudArsopb.findUnique({
        where: { id: input.solicitud_id },
      });
      if (!solicitud) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Solicitud no encontrada.",
        });
      }
      return ctx.prisma.solicitudArsopb.update({
        where: { id: input.solicitud_id },
        data: {
          estado: input.accion === "atendido" ? "resuelta" : "rechazada",
          resolucion: input.respuesta,
          respondida_por: ctx.userId!,
          fecha_respuesta: new Date(),
        },
      });
    }),
});
