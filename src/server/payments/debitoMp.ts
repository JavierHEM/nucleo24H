import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { APP_NAME, getAppUrl } from "@/lib/branding";
import {
  debitoAutorizado,
  fechaInicioDebito,
  mapPreapprovalStatus,
  referenciaPreapproval,
} from "@/lib/payments/debito";
import {
  actualizarMercadoPagoPreapproval,
  createMercadoPagoPreapproval,
  getMercadoPagoPreapproval,
  isMercadoPagoConfigured,
  MercadoPagoApiError,
  MercadoPagoNotConfiguredError,
  urlPreapprovalMercadoPago,
} from "@/lib/payments/mercadopago";

type Db = PrismaClient;

async function urlAutorizacion(preapprovalId: string): Promise<string> {
  const preapproval = await getMercadoPagoPreapproval(preapprovalId);
  const url = urlPreapprovalMercadoPago(preapproval);
  if (!url) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Mercado Pago no devolvió el enlace para autorizar el débito.",
    });
  }
  return url;
}

export async function iniciarDebitoAutomatico(args: {
  prisma: Db;
  tenantId: string;
  userId: string;
  periodoActual: string;
}): Promise<{ redirectUrl: string }> {
  if (!isMercadoPagoConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Los pagos con Mercado Pago aún no están disponibles.",
    });
  }

  const [suscripcion, tenant, user, pagado] = await Promise.all([
    args.prisma.suscripcion.findUnique({ where: { tenant_id: args.tenantId } }),
    args.prisma.tenant.findUnique({ where: { id: args.tenantId }, select: { nombre: true } }),
    args.prisma.user.findUnique({ where: { id: args.userId }, select: { email: true } }),
    args.prisma.pago.findFirst({
      where: { tenant_id: args.tenantId, periodo: args.periodoActual, estado: "pagado" },
      select: { id: true },
    }),
  ]);

  if (!suscripcion) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Este local todavía no tiene suscripción configurada.",
    });
  }
  if (suscripcion.estado === "cancelada" || suscripcion.estado === "suspendida") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No puedes activar el débito con la suscripción cancelada o suspendida.",
    });
  }
  if (!tenant || !user?.email) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró el local o tu email de contacto." });
  }
  if (debitoAutorizado({
    modoCobro: suscripcion.modo_cobro,
    preapprovalStatus: suscripcion.mp_preapproval_status,
  })) {
    throw new TRPCError({ code: "CONFLICT", message: "Este local ya tiene el débito automático activo." });
  }

  const statusActual = mapPreapprovalStatus(suscripcion.mp_preapproval_status);
  if (suscripcion.mp_preapproval_id && statusActual === "pending") {
    try {
      return { redirectUrl: await urlAutorizacion(suscripcion.mp_preapproval_id) };
    } catch (err) {
      console.error("[debito.iniciar] No se pudo reutilizar el preapproval pendiente", err, {
        preapprovalId: suscripcion.mp_preapproval_id,
        tenantId: args.tenantId,
      });
    }
  }

  if (suscripcion.mp_preapproval_id) {
    await cancelarPreapprovalSilencioso(suscripcion.mp_preapproval_id);
  }

  const inicio = fechaInicioDebito({
    pagadoEstePeriodo: Boolean(pagado),
    diaCobro: suscripcion.dia_cobro,
  });
  const hasta = suscripcion.hasta && suscripcion.hasta > new Date() ? suscripcion.hasta.toISOString() : undefined;

  try {
    const preapproval = await createMercadoPagoPreapproval({
      externalReference: referenciaPreapproval(suscripcion.id),
      titulo: `${APP_NAME} — ${tenant.nombre}`,
      monto: suscripcion.monto_clp,
      email: user.email,
      urlRetorno: `${getAppUrl()}/api/pagos/retorno`,
      startDate: inicio?.toISOString(),
      endDate: hasta,
    });
    const url = urlPreapprovalMercadoPago(preapproval);
    if (!url) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Mercado Pago no devolvió el enlace para autorizar el débito.",
      });
    }
    await args.prisma.suscripcion.update({
      where: { id: suscripcion.id },
      data: {
        mp_preapproval_id: preapproval.id,
        mp_preapproval_status: mapPreapprovalStatus(preapproval.status) ?? "pending",
      },
    });
    return { redirectUrl: url };
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    if (err instanceof MercadoPagoNotConfiguredError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Los pagos con Mercado Pago aún no están disponibles.",
      });
    }
    console.error("[debito.iniciar] Error creando preapproval", err, { tenantId: args.tenantId });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No pudimos iniciar el débito automático. Intenta de nuevo en unos minutos.",
    });
  }
}

export async function desactivarDebitoAutomatico(args: { prisma: Db; tenantId: string }) {
  const suscripcion = await args.prisma.suscripcion.findUnique({ where: { tenant_id: args.tenantId } });
  if (!suscripcion) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No hay una suscripción activa." });
  }
  if (suscripcion.modo_cobro !== "debito" && mapPreapprovalStatus(suscripcion.mp_preapproval_status) !== "pending") {
    throw new TRPCError({ code: "CONFLICT", message: "Este local ya paga mes a mes." });
  }

  if (suscripcion.mp_preapproval_id) {
    try {
      await actualizarMercadoPagoPreapproval(suscripcion.mp_preapproval_id, { status: "paused" });
    } catch (err) {
      if (!(err instanceof MercadoPagoApiError && err.status === 404)) {
        console.error("[debito.desactivar] No se pudo pausar el preapproval", err, {
          tenantId: args.tenantId,
          preapprovalId: suscripcion.mp_preapproval_id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No pudimos desactivar el débito en Mercado Pago. Intenta de nuevo.",
        });
      }
    }
  }

  return args.prisma.suscripcion.update({
    where: { id: suscripcion.id },
    data: { modo_cobro: "manual", mp_preapproval_status: "paused" },
  });
}

export async function cancelarPreapprovalDeSuscripcion(args: {
  prisma: Db;
  suscripcion: { id: string; mp_preapproval_id: string | null };
}) {
  if (!args.suscripcion.mp_preapproval_id) return;
  await cancelarPreapprovalSilencioso(args.suscripcion.mp_preapproval_id);
  await args.prisma.suscripcion.update({
    where: { id: args.suscripcion.id },
    data: { modo_cobro: "manual", mp_preapproval_status: "cancelled" },
  });
}

export async function sincronizarMontoPreapproval(args: {
  preapprovalId: string | null;
  preapprovalStatus: string | null;
  monto: number;
}) {
  if (!args.preapprovalId) return;
  if (mapPreapprovalStatus(args.preapprovalStatus) !== "authorized") return;
  try {
    await actualizarMercadoPagoPreapproval(args.preapprovalId, { monto: args.monto });
  } catch (err) {
    console.error("[debito.monto] No se pudo actualizar el cargo automático", err, {
      preapprovalId: args.preapprovalId,
      monto: args.monto,
    });
  }
}

async function cancelarPreapprovalSilencioso(preapprovalId: string) {
  try {
    await actualizarMercadoPagoPreapproval(preapprovalId, { status: "cancelled" });
  } catch (err) {
    if (err instanceof MercadoPagoApiError && (err.status === 404 || err.status === 400)) return;
    console.error("[debito.cancelar] Error cancelando preapproval", err, { preapprovalId });
  }
}
