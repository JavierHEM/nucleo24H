import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import {
  getFlowPaymentStatus,
  isFlowConfigured,
  mapFlowStatus,
} from "@/lib/payments/flow";

const bodySchema = z.object({ token: z.string().min(1) });

/**
 * Webhook de confirmación de Flow.cl (urlConfirmation).
 * Flow envía POST x-www-form-urlencoded con `token`.
 * Seguridad: nunca confiamos en el body — re-consultamos el estado
 * con una llamada firmada a payment/getStatus.
 */
export async function POST(req: NextRequest) {
  if (!isFlowConfigured()) {
    console.error("[webhook/flow] Recibido webhook pero Flow no está configurado.");
    return NextResponse.json({ error: "Flow no configurado" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const parsed = bodySchema.safeParse({ token: form?.get("token") });
  if (!parsed.success) {
    return NextResponse.json({ error: "token faltante" }, { status: 400 });
  }

  try {
    const status = await getFlowPaymentStatus(parsed.data.token);
    const estado = mapFlowStatus(status.status);

    const pago = await prisma.pago.findUnique({
      where: { flow_token: parsed.data.token },
    });

    if (!pago) {
      console.error("[webhook/flow] Pago no encontrado para token:", parsed.data.token);
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    if (estado === "pagado") {
      const recibido = Number(status.amount);
      if (!Number.isFinite(recibido) || Math.round(recibido) !== pago.monto_clp) {
        console.error("[webhook/flow] Monto distinto al registrado", {
          pagoId: pago.id,
          esperado: pago.monto_clp,
          recibido: status.amount,
        });
        return NextResponse.json({ error: "Monto no coincide" }, { status: 400 });
      }
    }

    // Idempotencia: si ya está en estado final, no reprocesar
    if (pago.estado === "pagado") {
      return NextResponse.json({ ok: true, estado: pago.estado });
    }

    await prisma.pago.update({
      where: { id: pago.id },
      data: {
        estado,
        flow_order: status.flowOrder,
        pagado_at: estado === "pagado" ? new Date() : null,
      },
    });

    // Pago exitoso → suscripción al día
    if (estado === "pagado" && pago.suscripcion_id) {
      await prisma.suscripcion.update({
        where: { id: pago.suscripcion_id },
        data: { estado: "activa" },
      });
    }

    return NextResponse.json({ ok: true, estado });
  } catch (err) {
    console.error("[webhook/flow] Error procesando confirmación:", err);
    // 500 → Flow reintenta la notificación
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
