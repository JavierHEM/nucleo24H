import { describe, expect, it } from "vitest";
import { cupoProfesional } from "@/lib/comunicaciones/cupos";

describe("cupoProfesional", () => {
  it("los primeros 30 días son ilimitados", () => {
    const r = cupoProfesional({
      tenantCreadoAt: new Date(2026, 10, 1),
      usadasEnPeriodo: 9,
      ahora: new Date(2026, 10, 20),
    });
    expect(r.ilimitado).toBe(true);
  });

  it("desde el día 30 tope de 5 y no acumula", () => {
    const r = cupoProfesional({
      tenantCreadoAt: new Date(2026, 8, 1),
      usadasEnPeriodo: 5,
      ahora: new Date(2026, 10, 4),
    });
    expect(r.ilimitado).toBe(false);
    expect(r.restantes).toBe(0);
  });
});
