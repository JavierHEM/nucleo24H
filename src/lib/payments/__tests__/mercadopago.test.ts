import { createHmac } from "crypto";
import { describe, it, expect } from "vitest";
import {
  mapMercadoPagoStatus,
  modoCoincide,
  montoCoincide,
  verificarFirmaMercadoPago,
} from "@/lib/payments/mercadopago";

const secret = "secreto-de-prueba";
const ahora = Date.UTC(2026, 5, 10, 12, 0, 0);

function firmar(dataId: string, requestId: string, ts: number) {
  const manifiesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  return `ts=${ts},v1=${createHmac("sha256", secret).update(manifiesto).digest("hex")}`;
}

describe("verificarFirmaMercadoPago", () => {
  it("acepta una firma válida y reciente", () => {
    const xSignature = firmar("ABC123", "req-1", ahora);
    expect(verificarFirmaMercadoPago({ xSignature, xRequestId: "req-1", dataId: "ABC123", secret, ahora })).toBe(true);
  });

  it("rechaza una firma de otro secreto", () => {
    const xSignature = firmar("123", "req-1", ahora);
    expect(verificarFirmaMercadoPago({ xSignature, xRequestId: "req-1", dataId: "123", secret: "otro", ahora })).toBe(false);
  });

  it("rechaza si cambia el id del recurso", () => {
    const xSignature = firmar("123", "req-1", ahora);
    expect(verificarFirmaMercadoPago({ xSignature, xRequestId: "req-1", dataId: "124", secret, ahora })).toBe(false);
  });

  it("rechaza firmas viejas (replay)", () => {
    const xSignature = firmar("123", "req-1", ahora - 10 * 60 * 1000);
    expect(verificarFirmaMercadoPago({ xSignature, xRequestId: "req-1", dataId: "123", secret, ahora })).toBe(false);
  });

  it("rechaza headers faltantes o mal formados", () => {
    expect(verificarFirmaMercadoPago({ xSignature: null, xRequestId: "r", dataId: "1", secret, ahora })).toBe(false);
    expect(verificarFirmaMercadoPago({ xSignature: "basura", xRequestId: "r", dataId: "1", secret, ahora })).toBe(false);
    expect(verificarFirmaMercadoPago({ xSignature: firmar("1", "r", ahora), xRequestId: null, dataId: "1", secret, ahora })).toBe(false);
  });
});

describe("estados y montos", () => {
  it("mapea los estados de Mercado Pago", () => {
    expect(mapMercadoPagoStatus("approved")).toBe("pagado");
    expect(mapMercadoPagoStatus("rejected")).toBe("rechazado");
    expect(mapMercadoPagoStatus("refunded")).toBe("anulado");
    expect(mapMercadoPagoStatus("in_process")).toBe("pendiente");
    expect(mapMercadoPagoStatus("desconocido")).toBe("pendiente");
  });

  it("exige el monto exacto en CLP", () => {
    expect(montoCoincide({ transaction_amount: 80000, currency_id: "CLP" }, 80000)).toBe(true);
    expect(montoCoincide({ transaction_amount: 79999, currency_id: "CLP" }, 80000)).toBe(false);
    expect(montoCoincide({ transaction_amount: 80000, currency_id: "USD" }, 80000)).toBe(false);
  });

  it("separa pruebas de producción", () => {
    expect(modoCoincide({ live_mode: false }, "prueba")).toBe(true);
    expect(modoCoincide({ live_mode: true }, "prueba")).toBe(false);
    expect(modoCoincide({ live_mode: true }, "produccion")).toBe(true);
    expect(modoCoincide({ live_mode: undefined }, "produccion")).toBe(false);
  });
});
