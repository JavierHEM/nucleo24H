import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { exigirAsesorAsignado } from "@/server/middleware/asesor";
import type { TRPCContext } from "@/server/trpc/context";

function contexto(userRole: TRPCContext["userRole"], asignacion: { id: string } | null) {
  const findFirst = vi.fn().mockResolvedValue(asignacion);
  const ctx = {
    userId: "u1",
    userRole,
    prisma: { asignacionAsesor: { findFirst } },
  } as unknown as TRPCContext;
  return { ctx, findFirst };
}

describe("exigirAsesorAsignado", () => {
  it("deja pasar a un asesor con asignación activa", async () => {
    const { ctx, findFirst } = contexto("asesor", { id: "a1" });
    await expect(exigirAsesorAsignado(ctx, "t1")).resolves.toBeUndefined();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant_id: "t1", asesor_id: "u1", activo: true } })
    );
  });

  it("rechaza a un asesor sin asignación", async () => {
    const { ctx } = contexto("asesor", null);
    const error = await exigirAsesorAsignado(ctx, "t1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("FORBIDDEN");
    expect((error as TRPCError).message).toBe("No tienes asignado este local.");
  });

  it("no restringe a admin_nucleo ni consulta la base", async () => {
    const { ctx, findFirst } = contexto("admin_nucleo", null);
    await expect(exigirAsesorAsignado(ctx, "t1")).resolves.toBeUndefined();
    expect(findFirst).not.toHaveBeenCalled();
  });
});
