export const PREFIJO_REF_SUSCRIPCION = "suscripcion:";

export type ModoCobro = "manual" | "debito";
export type EstadoPreapproval = "pending" | "authorized" | "paused" | "cancelled";
export type TipoWebhookMp =
  | "payment"
  | "subscription_preapproval"
  | "subscription_authorized_payment"
  | "ignorar";

export type DestinoPagoMp =
  | { tipo: "pago"; pagoId: string }
  | { tipo: "suscripcion"; suscripcionId: string }
  | { tipo: "desconocido" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function referenciaPreapproval(suscripcionId: string): string {
  return `${PREFIJO_REF_SUSCRIPCION}${suscripcionId}`;
}

export function idSuscripcionDesdeReferencia(ref: string | null | undefined): string | null {
  if (!ref?.startsWith(PREFIJO_REF_SUSCRIPCION)) return null;
  const id = ref.slice(PREFIJO_REF_SUSCRIPCION.length);
  return UUID_RE.test(id) ? id : null;
}

export function resolverDestinoPago(args: {
  externalReference: string | null | undefined;
}): DestinoPagoMp {
  const ref = args.externalReference?.trim() ?? "";
  if (!ref) return { tipo: "desconocido" };
  const suscripcionId = idSuscripcionDesdeReferencia(ref);
  if (suscripcionId) return { tipo: "suscripcion", suscripcionId };
  if (UUID_RE.test(ref)) return { tipo: "pago", pagoId: ref };
  return { tipo: "desconocido" };
}

export function mapPreapprovalStatus(status: string | null | undefined): EstadoPreapproval | null {
  if (!status) return null;
  const normalizado = status.toLowerCase();
  if (normalizado === "pending") return "pending";
  if (normalizado === "authorized") return "authorized";
  if (normalizado === "paused") return "paused";
  if (normalizado === "cancelled" || normalizado === "canceled") return "cancelled";
  return null;
}

export function modoCobroDesdePreapproval(status: EstadoPreapproval | null): ModoCobro | null {
  if (status === "authorized") return "debito";
  if (status === "paused" || status === "cancelled") return "manual";
  return null;
}

export function debitoAutorizado(args: {
  modoCobro?: string | null;
  preapprovalStatus?: string | null;
}): boolean {
  return args.modoCobro === "debito" && mapPreapprovalStatus(args.preapprovalStatus) === "authorized";
}

export function clasificarWebhookMp(tipo: string | null | undefined): TipoWebhookMp {
  if (tipo === "payment" || tipo === "topic_payment") return "payment";
  if (tipo === "subscription_preapproval") return "subscription_preapproval";
  if (tipo === "subscription_authorized_payment") return "subscription_authorized_payment";
  return "ignorar";
}

export function periodoDesdeFechaIso(iso: string, ahora: Date = new Date(iso)): string {
  const santiago = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  return `${santiago.getFullYear()}-${String(santiago.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Si el mes ya está pagado, el primer cargo automático es el mes siguiente
 * (día de cobro). Si aún no paga, Mercado Pago cobra al autorizar.
 */
export function fechaInicioDebito(args: {
  pagadoEstePeriodo: boolean;
  diaCobro: number;
  ahora?: Date;
}): Date | null {
  if (!args.pagadoEstePeriodo) return null;
  const ahora = args.ahora ?? new Date();
  const santiago = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const year = santiago.getMonth() === 11 ? santiago.getFullYear() + 1 : santiago.getFullYear();
  const month = (santiago.getMonth() + 1) % 12;
  const dia = Math.min(Math.max(args.diaCobro, 1), 28);
  return new Date(Date.UTC(year, month, dia, 15, 0, 0));
}

export function montoFacturaClp(amount: number | string | null | undefined): number | null {
  if (amount == null) return null;
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

export function estadoPagoDesdeFactura(args: {
  invoiceStatus: string | null | undefined;
  paymentStatus: string | null | undefined;
}): "pagado" | "rechazado" | "anulado" | "pendiente" | null {
  const invoice = args.invoiceStatus?.toLowerCase() ?? "";
  const payment = args.paymentStatus?.toLowerCase() ?? "";
  if (invoice === "cancelled" || invoice === "canceled") return "anulado";
  if (payment === "approved") return "pagado";
  if (payment === "rejected") return "rechazado";
  if (payment === "refunded" || payment === "charged_back" || payment === "cancelled") return "anulado";
  if (invoice === "scheduled" || invoice === "recycling" || !payment) return null;
  return "pendiente";
}
