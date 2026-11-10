import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { APP_NAME, getAppUrl } from "@/lib/branding";
import { PLAN_PRECIOS_CLP } from "@/lib/payments/flow";
import {
  createMercadoPagoPreference,
  isMercadoPagoConfigured,
  MercadoPagoNotConfiguredError,
  modoMercadoPago,
  urlCheckoutMercadoPago,
} from "@/lib/payments/mercadopago";
import { montoMercadoPagoParaRol } from "@/lib/payments/pruebaNucleo";

export async function iniciarPagoMercadoPago(args: {
  prisma: PrismaClient;
  tenantId: string;
  userId: string;
  userRole: string | null;
  periodo: string;
}): Promise<{ redirectUrl: string; monto_clp: number }> {
  if (!isMercadoPagoConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Los pagos con Mercado Pago aún no están disponibles.",
    });
  }

  const yaPagado = await args.prisma.pago.findFirst({
    where: { tenant_id: args.tenantId, periodo: args.periodo, estado: "pagado" },
  });
  if (yaPagado) {
    throw new TRPCError({ code: "CONFLICT", message: `El período ${args.periodo} ya está pagado.` });
  }

  const [suscripcion, tenant, user] = await Promise.all([
    args.prisma.suscripcion.findUnique({ where: { tenant_id: args.tenantId } }),
    args.prisma.tenant.findUnique({
      where: { id: args.tenantId },
      select: { nombre: true, plan: true, estado: true },
    }),
    args.prisma.user.findUnique({ where: { id: args.userId }, select: { email: true } }),
  ]);

  if (!tenant || tenant.estado === "baja") {
    throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró el local." });
  }
  if (!user?.email) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró tu email de contacto." });
  }

  const montoCatalogo = suscripcion?.monto_clp ?? PLAN_PRECIOS_CLP[tenant.plan] ?? PLAN_PRECIOS_CLP.calidad;
  const monto = montoMercadoPagoParaRol(args.userRole, montoCatalogo);

  await args.prisma.pago.updateMany({
    where: { tenant_id: args.tenantId, periodo: args.periodo, metodo: "mercadopago", estado: "pendiente" },
    data: { estado: "anulado" },
  });

  const pago = await args.prisma.pago.create({
    data: {
      tenant_id: args.tenantId,
      suscripcion_id: suscripcion?.id ?? null,
      periodo: args.periodo,
      monto_clp: monto,
      metodo: "mercadopago",
      estado: "pendiente",
    },
  });

  const appUrl = getAppUrl();
  const modo = modoMercadoPago();

  try {
    const preferencia = await createMercadoPagoPreference({
      pagoId: pago.id,
      titulo: `${APP_NAME} — ${tenant.nombre} — ${args.periodo}`,
      monto,
      email: user.email,
      urlRetorno: `${appUrl}/api/pagos/retorno`,
      urlNotificacion: `${appUrl}/api/webhooks/mercadopago/${modo}`,
    });
    return { redirectUrl: urlCheckoutMercadoPago(preferencia), monto_clp: monto };
  } catch (err) {
    await args.prisma.pago.update({ where: { id: pago.id }, data: { estado: "anulado" } });
    if (err instanceof MercadoPagoNotConfiguredError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Los pagos con Mercado Pago aún no están disponibles.",
      });
    }
    console.error("[pagos.iniciarPagoMercadoPago] Error creando preferencia:", err, {
      pagoId: pago.id,
      tenantId: args.tenantId,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No pudimos iniciar el pago. Intenta de nuevo en unos minutos.",
    });
  }
}
