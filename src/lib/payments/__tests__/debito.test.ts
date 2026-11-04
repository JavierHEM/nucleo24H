import { describe, expect, it } from "vitest";
import {
  clasificarWebhookMp,
  debitoAutorizado,
  estadoPagoDesdeFactura,
  fechaInicioDebito,
  idSuscripcionDesdeReferencia,
  mapPreapprovalStatus,
  modoCobroDesdePreapproval,
  montoFacturaClp,
  periodoDesdeFechaIso,
  referenciaPreapproval,
  resolverDestinoPago,
} from "@/lib/payments/debito";

const SUSCRIPCION_ID = "11111111-1111-4111-8111-111111111111";
const PAGO_ID = "22222222-2222-4222-8222-222222222222";

describe("referencia de preapproval", () => {
  it("no choca con el id de un pago puntual", () => {
    const ref = referenciaPreapproval(SUSCRIPCION_ID);
    expect(idSuscripcionDesdeReferencia(ref)).toBe(SUSCRIPCION_ID);
    expect(resolverDestinoPago({ externalReference: ref })).toEqual({
      tipo: "suscripcion",
      suscripcionId: SUSCRIPCION_ID,
    });
    expect(resolverDestinoPago({ externalReference: PAGO_ID })).toEqual({
      tipo: "pago",
      pagoId: PAGO_ID,
    });
    expect(resolverDestinoPago({ externalReference: null })).toEqual({ tipo: "desconocido" });
    expect(idSuscripcionDesdeReferencia(PAGO_ID)).toBeNull();
  });
});

describe("estados de débito", () => {
  it("normaliza canceled de Mercado Pago", () => {
    expect(mapPreapprovalStatus("canceled")).toBe("cancelled");
    expect(mapPreapprovalStatus("AUTHORIZED")).toBe("authorized");
    expect(mapPreapprovalStatus("otro")).toBeNull();
  });

  it("solo queda en débito cuando está autorizado", () => {
    expect(modoCobroDesdePreapproval("authorized")).toBe("debito");
    expect(modoCobroDesdePreapproval("pending")).toBeNull();
    expect(modoCobroDesdePreapproval("paused")).toBe("manual");
    expect(modoCobroDesdePreapproval("cancelled")).toBe("manual");
    expect(debitoAutorizado({ modoCobro: "debito", preapprovalStatus: "authorized" })).toBe(true);
    expect(debitoAutorizado({ modoCobro: "debito", preapprovalStatus: "pending" })).toBe(false);
    expect(debitoAutorizado({ modoCobro: "manual", preapprovalStatus: "authorized" })).toBe(false);
  });
});

describe("webhook de suscripciones", () => {
  it("clasifica payment, preapproval y factura; ignora el resto", () => {
    expect(clasificarWebhookMp("payment")).toBe("payment");
    expect(clasificarWebhookMp("topic_payment")).toBe("payment");
    expect(clasificarWebhookMp("subscription_preapproval")).toBe("subscription_preapproval");
    expect(clasificarWebhookMp("subscription_authorized_payment")).toBe("subscription_authorized_payment");
    expect(clasificarWebhookMp("subscription_preapproval_plan")).toBe("ignorar");
    expect(clasificarWebhookMp(null)).toBe("ignorar");
  });
});

describe("calendario del primer cargo", () => {
  it("omite start_date si el mes aún no está pagado", () => {
    expect(fechaInicioDebito({ pagadoEstePeriodo: false, diaCobro: 5, ahora: new Date("2026-11-04T15:00:00-03:00") })).toBeNull();
  });

  it("programa el mes siguiente si este mes ya está pagado", () => {
    const inicio = fechaInicioDebito({
      pagadoEstePeriodo: true,
      diaCobro: 5,
      ahora: new Date("2026-11-04T15:00:00-03:00"),
    });
    expect(inicio).not.toBeNull();
    expect(inicio?.toISOString()).toBe("2026-12-05T15:00:00.000Z");
  });

  it("saca el período de cobro en hora de Chile", () => {
    expect(periodoDesdeFechaIso("2026-11-05T02:00:00.000Z")).toBe("2026-11");
  });
});

describe("factura de débito", () => {
  it("redondea montos que Mercado Pago manda como string", () => {
    expect(montoFacturaClp("80000")).toBe(80000);
    expect(montoFacturaClp(80000.4)).toBe(80000);
    expect(montoFacturaClp("no")).toBeNull();
  });

  it("no registra un pago si la factura todavía está programada", () => {
    expect(estadoPagoDesdeFactura({ invoiceStatus: "scheduled", paymentStatus: null })).toBeNull();
    expect(estadoPagoDesdeFactura({ invoiceStatus: "processed", paymentStatus: "approved" })).toBe("pagado");
    expect(estadoPagoDesdeFactura({ invoiceStatus: "processed", paymentStatus: "rejected" })).toBe("rechazado");
    expect(estadoPagoDesdeFactura({ invoiceStatus: "cancelled", paymentStatus: null })).toBe("anulado");
  });
});
