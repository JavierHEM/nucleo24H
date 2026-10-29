import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import {
  getMercadoPagoPayment,
  isMercadoPagoConfigured,
  mapMercadoPagoStatus,
  modoCoincide,
  montoCoincide,
  verificarFirmaMercadoPago,
  type ModoWebhookMercadoPago,
} from "@/lib/payments/mercadopago";

export async function procesarWebhookMercadoPago(req: NextRequest, modo: ModoWebhookMercadoPago) {
  if (!isMercadoPagoConfigured()) {
    console.error("[webhook/mercadopago] Webhook recibido pero Mercado Pago no está configurado.", { modo });
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 503 });
  }

  const cuerpo = (await req.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
  const dataId = req.nextUrl.searchParams.get("data.id") ?? (cuerpo?.data?.id != null ? String(cuerpo.data.id) : null);
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

  const tipo = req.nextUrl.searchParams.get("type") ?? cuerpo?.type;
  if (tipo !== "payment") {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  try {
    const pagoMp = await getMercadoPagoPayment(dataId);

    if (!modoCoincide(pagoMp, modo)) {
      console.warn("[webhook/mercadopago] Notificación en el modo equivocado", { modo, dataId, liveMode: pagoMp.live_mode });
      return NextResponse.json({ ok: true, ignorado: true });
    }

    if (!pagoMp.external_reference) {
      console.error("[webhook/mercadopago] Pago sin external_reference", { dataId });
      return NextResponse.json({ error: "Pago sin referencia" }, { status: 400 });
    }

    const pago = await prisma.pago.findUnique({ where: { id: pagoMp.external_reference } });
    if (!pago) {
      console.error("[webhook/mercadopago] Pago no encontrado", { dataId, referencia: pagoMp.external_reference });
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

    if (pago.estado === "pagado") {
      return NextResponse.json({ ok: true, estado: pago.estado });
    }

    await prisma.pago.update({
      where: { id: pago.id },
      data: {
        estado,
        metodo: "mercadopago",
        mp_payment_id: String(pagoMp.id),
        pagado_at: estado === "pagado" ? new Date() : null,
      },
    });

    if (estado === "pagado" && pago.suscripcion_id) {
      await prisma.suscripcion.update({ where: { id: pago.suscripcion_id }, data: { estado: "activa" } });
    }

    return NextResponse.json({ ok: true, estado });
  } catch (error) {
    console.error("[webhook/mercadopago] Error procesando notificación:", error, { modo, dataId });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
