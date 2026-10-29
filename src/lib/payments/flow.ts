import { createHmac } from "crypto";
import { PLAN_PRECIOS_CLP as PRECIOS_PLANES } from "@/lib/planes";

/**
 * Cliente Flow.cl — API REST con firma HMAC-SHA256.
 * Docs: https://www.flow.cl/docs/api.html
 *
 * Degradación elegante: mientras el cliente no cree la cuenta Flow,
 * `isFlowConfigured()` retorna false y los callers deben mostrar
 * "pagos en línea no disponibles" en vez de fallar.
 */

const FLOW_DEFAULT_BASE_URL = "https://www.flow.cl/api";

export const PLAN_PRECIOS_CLP: Record<string, number> = PRECIOS_PLANES;

export type FlowEstadoPago = "pendiente" | "pagado" | "rechazado" | "anulado";

// Códigos de estado de Flow (payment/getStatus → status)
const FLOW_STATUS_MAP: Record<number, FlowEstadoPago> = {
  1: "pendiente",
  2: "pagado",
  3: "rechazado",
  4: "anulado",
};

export class FlowNotConfiguredError extends Error {
  constructor() {
    super("Flow.cl no está configurado (FLOW_API_KEY / FLOW_SECRET faltantes).");
    this.name = "FlowNotConfiguredError";
  }
}

export class FlowApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(`Flow API error en ${endpoint}: HTTP ${status} — ${body}`);
    this.name = "FlowApiError";
  }
}

interface FlowCredentials {
  apiKey: string;
  secret: string;
  baseUrl: string;
}

function getCredentials(): FlowCredentials | null {
  const apiKey = process.env.FLOW_API_KEY;
  const secret = process.env.FLOW_SECRET;
  if (!apiKey || !secret) return null;
  return {
    apiKey,
    secret,
    baseUrl: process.env.FLOW_BASE_URL ?? FLOW_DEFAULT_BASE_URL,
  };
}

export function isFlowConfigured(): boolean {
  return getCredentials() !== null;
}

/**
 * Firma según spec de Flow: parámetros ordenados alfabéticamente,
 * concatenados como `nombre + valor`, HMAC-SHA256 hex con el secret.
 */
export function signFlowParams(
  params: Record<string, string>,
  secret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");
  return createHmac("sha256", secret).update(toSign).digest("hex");
}

export function mapFlowStatus(status: number): FlowEstadoPago {
  return FLOW_STATUS_MAP[status] ?? "pendiente";
}

async function flowRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  method: "GET" | "POST"
): Promise<T> {
  const creds = getCredentials();
  if (!creds) throw new FlowNotConfiguredError();

  const signedParams: Record<string, string> = {
    ...params,
    apiKey: creds.apiKey,
  };
  const s = signFlowParams(signedParams, creds.secret);
  const body = new URLSearchParams({ ...signedParams, s });

  const url =
    method === "GET"
      ? `${creds.baseUrl}${endpoint}?${body.toString()}`
      : `${creds.baseUrl}${endpoint}`;

  const res = await fetch(url, {
    method,
    ...(method === "POST" && {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new FlowApiError(endpoint, res.status, text);
  }
  return JSON.parse(text) as T;
}

export interface CreateFlowPaymentInput {
  commerceOrder: string; // nuestro Pago.id
  subject: string;
  amount: number; // CLP, entero
  email: string;
  urlConfirmation: string; // webhook
  urlReturn: string; // retorno del usuario
}

export interface CreateFlowPaymentResult {
  url: string;
  token: string;
  flowOrder: number;
  redirectUrl: string; // url + ?token=
}

export async function createFlowPayment(
  input: CreateFlowPaymentInput
): Promise<CreateFlowPaymentResult> {
  const data = await flowRequest<{ url: string; token: string; flowOrder: number }>(
    "/payment/create",
    {
      commerceOrder: input.commerceOrder,
      subject: input.subject,
      currency: "CLP",
      amount: String(input.amount),
      email: input.email,
      urlConfirmation: input.urlConfirmation,
      urlReturn: input.urlReturn,
    },
    "POST"
  );

  return { ...data, redirectUrl: `${data.url}?token=${data.token}` };
}

export interface FlowPaymentStatus {
  flowOrder: number;
  commerceOrder: string;
  status: number; // 1 pendiente | 2 pagada | 3 rechazada | 4 anulada
  amount: string;
  payer: string;
  paymentData?: {
    date?: string;
    media?: string;
    amount?: string;
  } | null;
}

/**
 * Consulta el estado real del pago en Flow. Esta llamada firmada es
 * también la verificación de autenticidad del webhook: nunca confiar
 * en el body del POST de confirmación, siempre re-consultar.
 */
export async function getFlowPaymentStatus(
  token: string
): Promise<FlowPaymentStatus> {
  return flowRequest<FlowPaymentStatus>(
    "/payment/getStatus",
    { token },
    "GET"
  );
}
