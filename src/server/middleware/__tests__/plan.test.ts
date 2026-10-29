import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { requireModulo } from "@/server/middleware/plan";
import type { TRPCContext } from "@/server/trpc/context";

const prueba = router({
  ambiental: publicProcedure.use(requireModulo("ambiental")).query(({ ctx }) => ctx.planLocal.plan),
});

function contexto(plan: string, tenantActivo: string | null = "t1"): TRPCContext {
  const prisma = {
    tenant: { findUnique: vi.fn().mockResolvedValue({ plan, tipo_local: "restaurante" }) },
    suscripcion: { findUnique: vi.fn().mockResolvedValue(null) },
  };
  return { tenants: [], tenantActivo, userId: "u1", userRole: "asesor", prisma } as unknown as TRPCContext;
}

describe("requireModulo", () => {
  it("deja pasar a un local con Plan Integral", async () => {
    const caller = prueba.createCaller(contexto("integral"));
    await expect(caller.ambiental()).resolves.toBe("integral");
  });

  it("rechaza a un local con Plan Calidad con un mensaje en español", async () => {
    const caller = prueba.createCaller(contexto("calidad"));
    const error = await caller.ambiental().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("FORBIDDEN");
    expect((error as TRPCError).message).toContain("Plan Integral");
  });

  it("exige un local activo", async () => {
    const caller = prueba.createCaller(contexto("integral", null));
    const error = await caller.ambiental().catch((e: unknown) => e);
    expect((error as TRPCError).code).toBe("BAD_REQUEST");
  });
});
