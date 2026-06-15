/**
 * Tests unitarios para la lógica de comunicaciones.
 *
 * Evitamos instanciar Prisma o Supabase — testeamos lógica pura y
 * el comportamiento esperado del router con mocks de contexto.
 */
import { describe, it, expect, vi } from "vitest";

// ── Lógica extraída del router comunicaciones ────────────────────────────────

/**
 * Replica la lógica del `contadorNoLeidos` del router.
 * Retorna 0 cuando no hay tenant activo o userId — no debe lanzar error.
 */
function contadorNoLeidosLogica(
  tenantActivo: string | null,
  userId: string | null,
  prismaMock: { count: (args: unknown) => Promise<number> }
): Promise<number> {
  if (!tenantActivo || !userId) return Promise.resolve(0);
  return prismaMock.count({
    where: { tenant_id: tenantActivo, para: userId, leido: false },
  });
}

/**
 * Replica la lógica de selección de contactos para `getContactos`.
 * asesor/admin_nucleo → admins del tenant activo
 * admin_local/trabajador_local → asesor asignado
 */
function elegirTipoContacto(role: string): "admins_del_tenant" | "asesor_del_tenant" {
  if (role === "asesor" || role === "admin_nucleo") return "admins_del_tenant";
  return "asesor_del_tenant";
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("contadorNoLeidos – lógica defensiva", () => {
  it("retorna 0 si tenantActivo es null", async () => {
    const prisma = { count: vi.fn().mockResolvedValue(5) };
    const result = await contadorNoLeidosLogica(null, "user-1", prisma);
    expect(result).toBe(0);
    expect(prisma.count).not.toHaveBeenCalled();
  });

  it("retorna 0 si userId es null", async () => {
    const prisma = { count: vi.fn().mockResolvedValue(3) };
    const result = await contadorNoLeidosLogica("tenant-1", null, prisma);
    expect(result).toBe(0);
    expect(prisma.count).not.toHaveBeenCalled();
  });

  it("retorna 0 si ambos son null", async () => {
    const prisma = { count: vi.fn().mockResolvedValue(99) };
    const result = await contadorNoLeidosLogica(null, null, prisma);
    expect(result).toBe(0);
    expect(prisma.count).not.toHaveBeenCalled();
  });

  it("consulta Prisma cuando hay tenant y userId", async () => {
    const prisma = { count: vi.fn().mockResolvedValue(7) };
    const result = await contadorNoLeidosLogica("tenant-1", "user-1", prisma);
    expect(result).toBe(7);
    expect(prisma.count).toHaveBeenCalledOnce();
    expect(prisma.count).toHaveBeenCalledWith({
      where: { tenant_id: "tenant-1", para: "user-1", leido: false },
    });
  });

  it("retorna 0 mensajes no leídos (inbox vacío)", async () => {
    const prisma = { count: vi.fn().mockResolvedValue(0) };
    const result = await contadorNoLeidosLogica("tenant-1", "user-1", prisma);
    expect(result).toBe(0);
  });
});

describe("getContactos – selección de contactos por rol", () => {
  it("asesor ve admins del tenant activo", () => {
    expect(elegirTipoContacto("asesor")).toBe("admins_del_tenant");
  });

  it("admin_nucleo ve admins del tenant activo", () => {
    expect(elegirTipoContacto("admin_nucleo")).toBe("admins_del_tenant");
  });

  it("admin_local ve asesor asignado", () => {
    expect(elegirTipoContacto("admin_local")).toBe("asesor_del_tenant");
  });

  it("trabajador_local ve asesor asignado", () => {
    expect(elegirTipoContacto("trabajador_local")).toBe("asesor_del_tenant");
  });
});

describe("enviar mensaje – validaciones de longitud", () => {
  function validarMensaje(contenido: string): { ok: boolean; error?: string } {
    if (contenido.trim().length === 0) return { ok: false, error: "El mensaje está vacío" };
    if (contenido.length > 2000) return { ok: false, error: "Mensaje demasiado largo (máx. 2000 chars)" };
    return { ok: true };
  }

  it("mensaje vacío es inválido", () => {
    expect(validarMensaje("").ok).toBe(false);
    expect(validarMensaje("   ").ok).toBe(false);
  });

  it("mensaje de 1 carácter es válido", () => {
    expect(validarMensaje("x").ok).toBe(true);
  });

  it("mensaje de exactamente 2000 caracteres es válido", () => {
    expect(validarMensaje("a".repeat(2000)).ok).toBe(true);
  });

  it("mensaje de 2001 caracteres es inválido", () => {
    expect(validarMensaje("a".repeat(2001)).ok).toBe(false);
  });
});
