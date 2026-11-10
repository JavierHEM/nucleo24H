import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import {
  clasificarWebhookMp,
  debitoAutorizado,
  estadoPagoDesdeFactura,
  mapPreapprovalStatus,
  modoCobroDesdePreapproval,
  montoFacturaClp,
  periodoDesdeFechaIso,
  resolverDestinoPago,
} from "@/lib/payments/debito";
import {
  getMercadoPagoFacturaDebito,
  getMercadoPagoPayment,
  getMercadoPagoPreapproval,
  isMercadoPagoConfigured,
  mapMercadoPagoStatus,
  modoCoincide,
  montoCoincide,
  transicionPagoMercadoPago,
  verificarFirmaMercadoPago,
  type MercadoPagoEstadoPago,
  type ModoWebhookMercadoPago,
  type PagoMercadoPago,
} from "@/lib/payments/mercadopago";

export async function procesarWebhookMercadoPago(req: NextRequest, modo: ModoWebhookMercadoPago) {
  if (!isMercadoPagoConfigured()) {
    console.error("[webhook/mercadopago] Webhook recibido pero Mercado Pago no está configurado.", { modo });
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 503 });
  }

  const cuerpo = (await req.json().catch(() => null)) as {
    type?: string;
    topic?: string;
    data?: { id?: string | number };
  } | null;
  const dataId =
    req.nextUrl.searchParams.get("data.id") ??
    (cuerpo?.data?.id != null ? String(cuerpo.data.id) : null) ??
    req.nextUrl.searchParams.get("id");
  if (!dataId) {
    return NextResponse.json({ error: "data.id faltante" }, { status: 400 });
  }

  const firmaValida = verificarFirmaMercadoPago({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
    secret: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
  });
  if (!firmaValida) {
    console.error("[webhook/mercadopago] Firma inválida", { modo, dataId });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const tipo = clasificarWebhookMp(
    req.nextUrl.searchParams.get("type") ??
      req.nextUrl.searchParams.get("topic") ??
      cuerpo?.type ??
      cuerpo?.topic
  );

  try {
    if (tipo === "payment") return await procesarPago(dataId, modo);
    if (tipo === "subscription_preapproval") return await procesarPreapproval(dataId, modo);
    if (tipo === "subscription_authorized_payment") return await procesarFacturaDebito(dataId, modo);
    return NextResponse.json({ ok: true, ignorado: true });
  } catch (error) {
    console.error("[webhook/mercadopago] Error procesando notificación:", error, { modo, dataId, tipo });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

async function procesarPago(dataId: string, modo: ModoWebhookMercadoPago) {
  const pagoMp = await getMercadoPagoPayment(dataId);

  if (!modoCoincide(pagoMp, modo)) {
    console.warn("[webhook/mercadopago] Notificación en el modo equivocado", { modo, dataId, liveMode: pagoMp.live_mode });
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const destino = resolverDestinoPago({ externalReference: pagoMp.external_reference });

  if (destino.tipo === "pago") {
    return aplicarPagoExistente(pagoMp, destino.pagoId);
  }

  if (destino.tipo === "suscripcion") {
    const suscripcion = await prisma.suscripcion.findUnique({ where: { id: destino.suscripcionId } });
    if (!suscripcion) {
      console.error("[webhook/mercadopago] Suscripción no encontrada para débito", { dataId, destino });
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }
    return aplicarPagoDebito({
      suscripcion,
      pagoMp,
      periodo: periodoDesdeFechaIso(pagoMp.date_approved ?? new Date().toISOString()),
    });
  }

  const preapprovalId = pagoMp.metadata?.preapproval_id;
  if (preapprovalId) {
    const suscripcion = await prisma.suscripcion.findUnique({ where: { mp_preapproval_id: preapprovalId } });
    if (suscripcion) {
      return aplicarPagoDebito({
        suscripcion,
        pagoMp,
        periodo: periodoDesdeFechaIso(pagoMp.date_approved ?? new Date().toISOString()),
      });
    }
  }

  console.error("[webhook/mercadopago] Pago sin referencia reconocida", { dataId, referencia: pagoMp.external_reference });
  return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
}

async function procesarPreapproval(dataId: string, modo: ModoWebhookMercadoPago) {
  const preapproval = await getMercadoPagoPreapproval(dataId);
  if (preapproval.live_mode != null && !modoCoincide({ live_mode: preapproval.live_mode }, modo)) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const destino = resolverDestinoPago({ externalReference: preapproval.external_reference ?? null });
  const suscripcion =
    (await prisma.suscripcion.findUnique({ where: { mp_preapproval_id: preapproval.id } })) ??
    (destino.tipo === "suscripcion"
      ? await prisma.suscripcion.findUnique({ where: { id: destino.suscripcionId } })
      : null);

  if (!suscripcion) {
    console.error("[webhook/mercadopago] Preapproval sin suscripción local", { dataId, ref: preapproval.external_reference });
    return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
  }

  const status = mapPreapprovalStatus(preapproval.status);
  if (!status) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const modoCobro = modoCobroDesdePreapproval(status);
  await prisma.suscripcion.update({
    where: { id: suscripcion.id },
    data: {
      mp_preapproval_id: preapproval.id,
      mp_preapproval_status: status,
      ...(modoCobro ? { modo_cobro: modoCobro } : {}),
    },
  });

  console.info("[webhook/mercadopago] Débito actualizado", {
    suscripcionId: suscripcion.id,
    tenantId: suscripcion.tenant_id,
    status,
    modoCobro: modoCobro ?? suscripcion.modo_cobro,
  });

  return NextResponse.json({ ok: true, status });
}

async function procesarFacturaDebito(dataId: string, modo: ModoWebhookMercadoPago) {
  const factura = await getMercadoPagoFacturaDebito(dataId);
  const estado = estadoPagoDesdeFactura({
    invoiceStatus: factura.status,
    paymentStatus: factura.payment?.status,
  });
  if (!estado || !factura.payment?.id) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const pagoMp = await getMercadoPagoPayment(String(factura.payment.id));
  if (!modoCoincide(pagoMp, modo)) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const suscripcion = await prisma.suscripcion.findUnique({
    where: { mp_preapproval_id: factura.preapproval_id },
  });
  if (!suscripcion) {
    const destino = resolverDestinoPago({
      externalReference: factura.external_reference != null ? String(factura.external_reference) : pagoMp.external_reference,
    });
    if (destino.tipo !== "suscripcion") {
      console.error("[webhook/mercadopago] Factura de débito sin suscripción", { dataId, preapproval: factura.preapproval_id });
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }
    const porRef = await prisma.suscripcion.findUnique({ where: { id: destino.suscripcionId } });
    if (!porRef) return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    return aplicarPagoDebito({
      suscripcion: porRef,
      pagoMp,
      periodo: periodoDesdeFechaIso(factura.debit_date ?? pagoMp.date_approved ?? new Date().toISOString()),
    });
  }

  return aplicarPagoDebito({
    suscripcion,
    pagoMp,
    periodo: periodoDesdeFechaIso(factura.debit_date ?? pagoMp.date_approved ?? new Date().toISOString()),
  });
}

async function aplicarPagoExistente(pagoMp: PagoMercadoPago, pagoId: string) {
  const pago = await prisma.pago.findUnique({ where: { id: pagoId } });
  if (!pago) {
    console.error("[webhook/mercadopago] Pago no encontrado", { dataId: pagoMp.id, referencia: pagoMp.external_reference });
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  const estado = mapMercadoPagoStatus(pagoMp.status);
  if (estado === "pagado" && !montoCoincide(pagoMp, pago.monto_clp)) {
    console.error("[webhook/mercadopago] Monto distinto al registrado", {
      pagoId: pago.id,
      esperado: pago.monto_clp,
      recibido: pagoMp.transaction_amount,
      moneda: pagoMp.currency_id,
    });
    return NextResponse.json({ error: "Monto no coincide" }, { status: 400 });
  }

  return persistirTransicionPago({
    pago,
    estado,
    pagoMp,
    metodo: pago.metodo === "debito" ? "debito" : "mercadopago",
  });
}

async function aplicarPagoDebito(args: {
  suscripcion: {
    id: string;
    tenant_id: string;
    monto_clp: number;
    modo_cobro: string;
    mp_preapproval_status: string | null;
  };
  pagoMp: PagoMercadoPago;
  periodo: string;
}) {
  const estado = mapMercadoPagoStatus(args.pagoMp.status);
  const monto = montoFacturaClp(args.pagoMp.transaction_amount);
  if (estado === "pagado" && (monto == null || !montoCoincide(args.pagoMp, args.suscripcion.monto_clp))) {
    console.error("[webhook/mercadopago] Monto de débito distinto al de la suscripción", {
      suscripcionId: args.suscripcion.id,
      esperado: args.suscripcion.monto_clp,
      recibido: args.pagoMp.transaction_amount,
    });
    return NextResponse.json({ error: "Monto no coincide" }, { status: 400 });
  }

  const mpPaymentId = String(args.pagoMp.id);
  const existente = await prisma.pago.findFirst({
    where: {
      OR: [{ mp_payment_id: mpPaymentId }, { tenant_id: args.suscripcion.tenant_id, periodo: args.periodo, estado: "pagado" }],
    },
    orderBy: { created_at: "desc" },
  });

  if (existente?.mp_payment_id === mpPaymentId) {
    return persistirTransicionPago({
      pago: existente,
      estado,
      pagoMp: args.pagoMp,
      metodo: "debito",
    });
  }

  if (existente?.estado === "pagado" && estado === "pagado") {
    return NextResponse.json({ ok: true, estado: "pagado", duplicado: true });
  }

  const pago = await prisma.pago.create({
    data: {
      tenant_id: args.suscripcion.tenant_id,
      suscripcion_id: args.suscripcion.id,
      periodo: args.periodo,
      monto_clp: args.suscripcion.monto_clp,
      metodo: "debito",
      estado: "pendiente",
      mp_payment_id: mpPaymentId,
    },
  });

  const resultado = await persistirTransicionPago({
    pago,
    estado,
    pagoMp: args.pagoMp,
    metodo: "debito",
  });

  if (
    estado === "pagado" &&
    !debitoAutorizado({
      modoCobro: args.suscripcion.modo_cobro,
      preapprovalStatus: args.suscripcion.mp_preapproval_status,
    })
  ) {
    await prisma.suscripcion.update({
      where: { id: args.suscripcion.id },
      data: { modo_cobro: "debito", mp_preapproval_status: "authorized" },
    });
  }

  return resultado;
}

async function persistirTransicionPago(args: {
  pago: {
    id: string;
    tenant_id: string;
    periodo: string;
    estado: string;
    suscripcion_id: string | null;
    pagado_at: Date | null;
    observacion: string | null;
  };
  estado: MercadoPagoEstadoPago;
  pagoMp: PagoMercadoPago;
  metodo: "mercadopago" | "debito";
}) {
  const otroPagado = await prisma.pago.findFirst({
    where: {
      tenant_id: args.pago.tenant_id,
      periodo: args.pago.periodo,
      estado: "pagado",
      id: { not: args.pago.id },
    },
    select: { id: true },
  });

  const transicion = transicionPagoMercadoPago({
    estadoActual: args.pago.estado,
    estadoNuevo: args.estado,
    hayOtroPagoDelPeriodo: Boolean(otroPagado),
  });

  if (!transicion.actualizarPago) {
    return NextResponse.json({ ok: true, estado: args.pago.estado });
  }

  const observacionReverso =
    args.pago.estado === "pagado" && args.estado === "anulado"
      ? [args.pago.observacion, `Reembolso o contracargo Mercado Pago (${args.pagoMp.status})`].filter(Boolean).join(" · ")
      : args.pago.observacion;

  await prisma.pago.update({
    where: { id: args.pago.id },
    data: {
      estado: args.estado,
      metodo: args.metodo,
      mp_payment_id: String(args.pagoMp.id),
      pagado_at: args.estado === "pagado" ? new Date() : args.pago.pagado_at,
      observacion: observacionReverso,
    },
  });

  if (transicion.suscripcion && args.pago.suscripcion_id) {
    await prisma.suscripcion.update({
      where: { id: args.pago.suscripcion_id },
      data: { estado: transicion.suscripcion },
    });
    console.info("[webhook/mercadopago] Suscripción actualizada", {
      pagoId: args.pago.id,
      tenantId: args.pago.tenant_id,
      estadoPago: args.estado,
      suscripcion: transicion.suscripcion,
      mpStatus: args.pagoMp.status,
      metodo: args.metodo,
    });
  }

  if (args.estado === "pagado") {
    const { habilitarLocalTrasPago } = await import("@/server/locales/habilitarTrasPago");
    await habilitarLocalTrasPago(args.pago.tenant_id);
  }

  return NextResponse.json({ ok: true, estado: args.estado });
}
