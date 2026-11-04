import { prisma } from "@/server/db/prisma";
import type { UserRole } from "@/server/trpc/context";

const SELECT_LOCAL = { id: true, nombre: true, rut: true, created_at: true } as const;

export async function localesVisibles(userId: string, userRole: UserRole | null) {
  if (userRole === "admin_nucleo") {
    return prisma.tenant.findMany({
      where: { estado: { not: "baja" } },
      select: SELECT_LOCAL,
      orderBy: { nombre: "asc" },
    });
  }

  if (userRole === "asesor") {
    const asignaciones = await prisma.asignacionAsesor.findMany({
      where: { asesor_id: userId, activo: true },
      include: { tenant: { select: SELECT_LOCAL } },
    });
    return asignaciones
      .map((asignacion) => asignacion.tenant)
      .filter((tenant) => Boolean(tenant))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  const vinculos = await prisma.userTenant.findMany({
    where: { user_id: userId },
    include: { tenant: { select: SELECT_LOCAL } },
  });
  return vinculos
    .map((vinculo) => vinculo.tenant)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
