import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole, requireNucleo } from "@/server/middleware/rbac";
import {
  createFlowPayment,
  isFlowConfigured,
  PLAN_PRECIOS_CLP,
  FlowNotConfiguredError,
} from "@/lib/payments/flow";
import { APP_NAME } from "@/lib/branding";

const protectedProcedure = publicProcedure.use(withTenant);
const adminLocalProcedure = protectedProcedure.use(
  requireRole("admin_local", "admin_nucleo")
);
const nucleoProcedure = publicProcedure.use(requireNucleo);

const PERIODO_REGEX = /^\d{4}-\d{2}$/;

export const pagosRouter = router({
  /** Estado de suscripción + historial de pagos del tenant activo */
  getSuscripcion: adminLocalProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantActivo) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No hay un local activo seleccionado.",
      });
    }

    const [suscripcion, pagos, tenant] = await Promise.all([
      ctx.prisma.suscripcion.findUnique({
        where: { tenant_id: ctx.tenantActivo },
      }),
      ctx.prisma.pago.findMany({
        where: { tenant_id: ctx.tenantActivo },
        orderBy: { created_at: "desc" },
        take: 24,
      }),
      ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantActivo },
        select: { plan: true, nombre: true },
      }),
    ]);

    return {
      suscripcion,
      pagos,
      plan: suscripcion?.plan ?? tenant?.plan ?? "calidad",
      montoMensual:
        suscripcion?.monto_clp ??
        PLAN_PRECIOS_CLP[tenant?.plan ?? "calidad"] ??
        PLAN_PRECIOS_CLP.calidad,
      pagosEnLineaDisponibles: isFlowConfigured(),
    };
  }),

  /** Inicia un pago en línea vía Flow.cl — retorna URL de redirección */
  pagar: adminLocalProcedure
    .input(z.object({ periodo: z.string().regex(PERIODO_REGEX) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantActivo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No hay un local activo seleccionado.",
        });
      }

      if (!isFlowConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            `Los pagos en línea aún no están disponibles. Contacta a ${APP_NAME} para pagar por transferencia.`,
        });
      }

      const yaPagado = await ctx.prisma.pago.findFirst({
        where: {
          tenant_id: ctx.tenantActivo,
          periodo: input.periodo,
          estado: "pagado",
        },
      });
      if (yaPagado) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `El período ${input.periodo} ya está pagado.`,
        });
      }

      const [suscripcion, tenant, user] = await Promise.all([
        ctx.prisma.suscripcion.findUnique({
          where: { tenant_id: ctx.tenantActivo },
        }),
        ctx.prisma.tenant.findUnique({
          where: { id: ctx.tenantActivo },
          select: { nombre: true, plan: true },
        }),
        ctx.prisma.user.findUnique({
          where: { id: ctx.userId! },
          select: { email: true },
        }),
      ]);

      if (!tenant || !user?.email) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No se encontró el local o tu email de contacto.",
        });
      }

      const monto =
        suscripcion?.monto_clp ?? PLAN_PRECIOS_CLP[tenant.plan] ?? PLAN_PRECIOS_CLP.calidad;

      // Anular intentos pendientes anteriores del mismo período
      await ctx.prisma.pago.updateMany({
        where: {
          tenant_id: ctx.tenantActivo,
          periodo: input.periodo,
          metodo: "flow",
          estado: "pendiente",
        },
        data: { estado: "anulado" },
      });

      const pago = await ctx.prisma.pago.create({
        data: {
          tenant_id: ctx.tenantActivo,
          suscripcion_id: suscripcion?.id ?? null,
          periodo: input.periodo,
          monto_clp: monto,
          metodo: "flow",
          estado: "pendiente",
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      try {
        const flowPayment = await createFlowPayment({
          commerceOrder: pago.id,
          subject: `${APP_NAME} — ${tenant.nombre} — ${input.periodo}`,
          amount: monto,
          email: user.email,
          urlConfirmation: `${appUrl}/api/webhooks/flow`,
          urlReturn: `${appUrl}/api/pagos/retorno`,
        });

        await ctx.prisma.pago.update({
          where: { id: pago.id },
          data: {
            flow_token: flowPayment.token,
            flow_order: flowPayment.flowOrder,
          },
        });

        return { redirectUrl: flowPayment.redirectUrl };
      } catch (err) {
        // Revertir el pago pendiente si Flow rechazó la creación
        await ctx.prisma.pago.update({
          where: { id: pago.id },
          data: { estado: "anulado" },
        });

        if (err instanceof FlowNotConfiguredError) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Los pagos en línea aún no están disponibles.",
          });
        }
        console.error("[pagos.pagar] Error creando pago Flow:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No pudimos iniciar el pago. Intenta de nuevo en unos minutos.",
        });
      }
    }),

  /** admin_nucleo: panorama de cobranza de todos los locales para un período */
  adminResumen: nucleoProcedure
    .input(z.object({ periodo: z.string().regex(PERIODO_REGEX) }))
    .query(async ({ ctx, input }) => {
      const tenants = await ctx.prisma.tenant.findMany({
        where: { estado: { not: "baja" } },
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          nombre: true,
          plan: true,
          estado: true,
          suscripcion: {
            select: {
              id: true,
              plan: true,
              monto_clp: true,
              estado: true,
              dia_cobro: true,
            },
          },
          pagos: {
            where: { periodo: input.periodo },
            orderBy: { created_at: "desc" },
            take: 1,
            select: {
              id: true,
              estado: true,
              metodo: true,
              monto_clp: true,
              pagado_at: true,
            },
          },
        },
      });

      return tenants.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        plan: t.suscripcion?.plan ?? t.plan,
        estado: t.estado,
        suscripcion: t.suscripcion,
        montoMensual:
          t.suscripcion?.monto_clp ??
          PLAN_PRECIOS_CLP[t.plan] ??
          PLAN_PRECIOS_CLP.calidad,
        pagoPeriodo: t.pagos[0] ?? null,
      }));
    }),

  /** admin_nucleo: crea o actualiza la suscripción de un local */
  configurarSuscripcion: nucleoProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        plan: z.enum(["calidad", "integral"]),
        monto_clp: z.number().int().positive().optional(),
        dia_cobro: z.number().int().min(1).max(28).optional(),
        estado: z
          .enum(["activa", "morosa", "suspendida", "cancelada"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const monto = input.monto_clp ?? PLAN_PRECIOS_CLP[input.plan];

      return ctx.prisma.suscripcion.upsert({
        where: { tenant_id: input.tenant_id },
        create: {
          tenant_id: input.tenant_id,
          plan: input.plan,
          monto_clp: monto,
          dia_cobro: input.dia_cobro ?? 5,
          estado: input.estado ?? "activa",
        },
        update: {
          plan: input.plan,
          monto_clp: monto,
          ...(input.dia_cobro && { dia_cobro: input.dia_cobro }),
          ...(input.estado && { estado: input.estado }),
        },
      });
    }),

  /**
   * admin_nucleo: registra un pago recibido por transferencia bancaria.
   * Vía principal de cobro mientras Flow.cl no esté habilitado.
   */
  registrarPagoManual: nucleoProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        periodo: z.string().regex(PERIODO_REGEX),
        monto_clp: z.number().int().positive(),
        observacion: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const yaPagado = await ctx.prisma.pago.findFirst({
        where: {
          tenant_id: input.tenant_id,
          periodo: input.periodo,
          estado: "pagado",
        },
      });
      if (yaPagado) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `El período ${input.periodo} ya tiene un pago registrado.`,
        });
      }

      const suscripcion = await ctx.prisma.suscripcion.findUnique({
        where: { tenant_id: input.tenant_id },
      });

      const pago = await ctx.prisma.pago.create({
        data: {
          tenant_id: input.tenant_id,
          suscripcion_id: suscripcion?.id ?? null,
          periodo: input.periodo,
          monto_clp: input.monto_clp,
          metodo: "transferencia",
          estado: "pagado",
          pagado_at: new Date(),
          registrado_por: ctx.userId,
          observacion: input.observacion,
        },
      });

      if (suscripcion && suscripcion.estado === "morosa") {
        await ctx.prisma.suscripcion.update({
          where: { id: suscripcion.id },
          data: { estado: "activa" },
        });
      }

      return pago;
    }),
});
