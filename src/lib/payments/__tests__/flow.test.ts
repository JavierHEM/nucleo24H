import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import {
  signFlowParams,
  mapFlowStatus,
  isFlowConfigured,
  PLAN_PRECIOS_CLP,
  FlowNotConfiguredError,
  FlowApiError,
} from "../flow";

describe("signFlowParams", () => {
  it("firma con parámetros ordenados alfabéticamente (nombre+valor)", () => {
    const secret = "test-secret";
    const params = {
      commerceOrder: "abc-123",
      apiKey: "key-1",
      amount: "80000",
    };

    // Orden alfabético esperado: amount, apiKey, commerceOrder
    const expected = createHmac("sha256", secret)
      .update("amount80000apiKeykey-1commerceOrderabc-123")
      .digest("hex");

    expect(signFlowParams(params, secret)).toBe(expected);
  });

  it("produce firmas distintas para secrets distintos", () => {
    const params = { token: "t1" };
    expect(signFlowParams(params, "secret-a")).not.toBe(
      signFlowParams(params, "secret-b")
    );
  });

  it("la firma es determinista", () => {
    const params = { token: "t1", apiKey: "k" };
    expect(signFlowParams(params, "s")).toBe(signFlowParams(params, "s"));
  });
});

describe("mapFlowStatus", () => {
  it("mapea los 4 estados de Flow", () => {
    expect(mapFlowStatus(1)).toBe("pendiente");
    expect(mapFlowStatus(2)).toBe("pagado");
    expect(mapFlowStatus(3)).toBe("rechazado");
    expect(mapFlowStatus(4)).toBe("anulado");
  });

  it("estado desconocido cae a pendiente (no marcar pagado por error)", () => {
    expect(mapFlowStatus(99)).toBe("pendiente");
    expect(mapFlowStatus(0)).toBe("pendiente");
  });
});

describe("isFlowConfigured", () => {
  const originalApiKey = process.env.FLOW_API_KEY;
  const originalSecret = process.env.FLOW_SECRET;

  beforeEach(() => {
    delete process.env.FLOW_API_KEY;
    delete process.env.FLOW_SECRET;
  });

  afterEach(() => {
    if (originalApiKey !== undefined) process.env.FLOW_API_KEY = originalApiKey;
    else delete process.env.FLOW_API_KEY;
    if (originalSecret !== undefined) process.env.FLOW_SECRET = originalSecret;
    else delete process.env.FLOW_SECRET;
  });

  it("retorna false sin credenciales", () => {
    expect(isFlowConfigured()).toBe(false);
  });

  it("retorna false con credenciales parciales", () => {
    process.env.FLOW_API_KEY = "key";
    expect(isFlowConfigured()).toBe(false);
  });

  it("retorna true con apiKey y secret", () => {
    process.env.FLOW_API_KEY = "key";
    process.env.FLOW_SECRET = "secret";
    expect(isFlowConfigured()).toBe(true);
  });
});

describe("PLAN_PRECIOS_CLP", () => {
  it("refleja los precios del SRS", () => {
    expect(PLAN_PRECIOS_CLP.calidad).toBe(80_000);
    expect(PLAN_PRECIOS_CLP.integral).toBe(150_000);
  });
});

describe("FlowNotConfiguredError", () => {
  it("es instancia de Error", () => {
    const err = new FlowNotConfiguredError();
    expect(err).toBeInstanceOf(Error);
  });

  it("tiene name 'FlowNotConfiguredError'", () => {
    const err = new FlowNotConfiguredError();
    expect(err.name).toBe("FlowNotConfiguredError");
  });

  it("el mensaje menciona las variables de entorno faltantes", () => {
    const err = new FlowNotConfiguredError();
    expect(err.message).toContain("FLOW_API_KEY");
    expect(err.message).toContain("FLOW_SECRET");
  });
});

describe("FlowApiError", () => {
  it("es instancia de Error", () => {
    const err = new FlowApiError("/payment/create", 422, "Unprocessable Entity");
    expect(err).toBeInstanceOf(Error);
  });

  it("tiene name 'FlowApiError'", () => {
    const err = new FlowApiError("/payment/create", 422, "body");
    expect(err.name).toBe("FlowApiError");
  });

  it("expone endpoint, status y body como propiedades públicas", () => {
    const err = new FlowApiError("/endpoint", 500, "server error");
    expect(err.endpoint).toBe("/endpoint");
    expect(err.status).toBe(500);
    expect(err.body).toBe("server error");
  });

  it("el mensaje incluye el endpoint y el status HTTP", () => {
    const err = new FlowApiError("/payment/create", 401, "Unauthorized");
    expect(err.message).toContain("/payment/create");
    expect(err.message).toContain("401");
  });
});
