import type { PrismaClient } from "@prisma/client";
import { elegibilidadDescargo, type ElegibilidadDescargo } from "@/lib/descargos";
import { leerReglasSello } from "@/server/sello-engine/emitirService";

export async function elegibilidadDeLocal(prisma: PrismaClient, tenantId: string): Promise<ElegibilidadDescargo> {
  const [sello, reglas] = await Promise.all([
    prisma.sello.findFirst({
      where: { tenant_id: tenantId },
      orderBy: [{ periodo: "desc" }, { emitido_at: "desc" }],
      select: { nivel: true, score_general: true, periodo: true },
    }),
    leerReglasSello(prisma),
  ]);
  return elegibilidadDescargo(sello, reglas.umbrales.premium);
}
