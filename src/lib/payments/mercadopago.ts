import { createHmac, timingSafeEqual } from "crypto";

const MP_API_URL = "https://api.mercadopago.com";
const TOLERANCIA_FIRMA_MS = 5 * 60 * 1000;

export type MercadoPagoEstadoPago = "pendiente" | "pagado" | "rechazado" | "anulado";

const MP_STATUS_MAP: Record<string, MercadoPagoEstadoPago> = {
  approved: "pagado",
  authorized: "pendiente",
  in_process: "pendiente",
  in_mediation: "pendiente",
  pending: "pendiente",
  rejected: "rechazado",
  cancelled: "anulado",
  refunded: "anulado",
  charged_back: "anulado",
};

export class MercadoPagoNotConfiguredError extends Error {
  constructor() {
    super("Mercado Pago no está configurado (MERCADOPAGO_ACCESS_TOKEN faltante).");
    this.name = "MercadoPagoNotConfiguredError";
  }
}

export class MercadoPagoApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(`Mercado Pago API error en ${endpoint}: HTTP ${status} — ${body}`);
    this.name = "MercadoPagoApiError";
  }
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_WEBHOOK_SECRET);
}

export function mapMercadoPagoStatus(status: string): MercadoPagoEstadoPago {
  return MP_STATUS_MAP[status] ?? "pendiente";
}

export type FirmaMercadoPago = {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
  ahora?: number;
};

/**
 * Valida el header x-signature ("ts=...,v1=...") con el manifiesto
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` firmado con HMAC-SHA256.
 */
export function verificarFirmaMercadoPago({ xSignature, xRequestId, dataId, secret, ahora = Date.now() }: FirmaMercadoPago): boolean {
  if (!xSignature || !xRequestId) return false;

  const partes = Object.fromEntries(
    xSignature.split(",").map((parte) => {
      const [clave, ...valor] = parte.trim().split("=");
      return [clave, valor.join("=")];
    })
  ) as Record<string, string | undefined>;

  const ts = partes.ts;
  const recibida = partes.v1;
  if (!ts || !recibida) return false;

  const tsMs = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
  if (!Number.isFinite(tsMs) || Math.abs(ahora - tsMs) > TOLERANCIA_FIRMA_MS) return false;

  const manifiesto = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const esperada = createHmac("sha256", secret).update(manifiesto).digest("hex");

  const a = Buffer.from(esperada, "utf8");
  const b = Buffer.from(recibida, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new MercadoPagoNotConfiguredError();
  return token;
}

async function llamarApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${MP_API_URL}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const cuerpo = await respuesta.text();
  if (!respuesta.ok) throw new MercadoPagoApiError(endpoint, respuesta.status, cuerpo);
  return JSON.parse(cuerpo) as T;
}

export type PagoMercadoPago = {
  id: number;
  status: string;
  transaction_amount: number;
  currency_id: string;
  external_reference: string | null;
  live_mode?: boolean;
  date_approved?: string | null;
};

export function getMercadoPagoPayment(id: string): Promise<PagoMercadoPago> {
  return llamarApi<PagoMercadoPago>(`/v1/payments/${encodeURIComponent(id)}`);
}

export async function createMercadoPagoPreference(params: {
  pagoId: string;
  titulo: string;
  monto: number;
  email: string;
  urlRetorno: string;
  urlNotificacion: string;
}): Promise<{ id: string; initPoint: string; sandboxInitPoint: string }> {
  const preferencia = await llamarApi<{ id: string; init_point: string; sandbox_init_point: string }>(
    "/checkout/preferences",
    {
      method: "POST",
      body: JSON.stringify({
        items: [{ title: params.titulo, quantity: 1, unit_price: params.monto, currency_id: "CLP" }],
        payer: { email: params.email },
        external_reference: params.pagoId,
        back_urls: { success: params.urlRetorno, failure: params.urlRetorno, pending: params.urlRetorno },
        auto_return: "approved",
        notification_url: params.urlNotificacion,
      }),
    }
  );
  return { id: preferencia.id, initPoint: preferencia.init_point, sandboxInitPoint: preferencia.sandbox_init_point };
}

export type ModoWebhookMercadoPago = "prueba" | "produccion";

export function modoCoincide(pago: Pick<PagoMercadoPago, "live_mode">, modo: ModoWebhookMercadoPago): boolean {
  return modo === "produccion" ? pago.live_mode === true : pago.live_mode === false;
}

export function montoCoincide(pago: Pick<PagoMercadoPago, "transaction_amount" | "currency_id">, esperadoClp: number): boolean {
  return pago.currency_id === "CLP" && Number.isFinite(pago.transaction_amount) && Math.round(pago.transaction_amount) === esperadoClp;
}
