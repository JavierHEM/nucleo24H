import { prisma } from "@/server/db/prisma";
import { debeHabilitarTrasPago } from "@/lib/locales/estado";

/** El local nace pendiente; el primer pago pagado lo habilita. */
export async function habilitarLocalTrasPago(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { estado: true },
  });
  if (!tenant || !debeHabilitarTrasPago(tenant.estado)) return;
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { estado: "activo" },
  });
}
