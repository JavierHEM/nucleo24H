import type { PrismaClient } from "@prisma/client";
import { normalizarEmail } from "@/lib/auth/email";

type Db = Pick<PrismaClient, "$queryRaw">;

/** Busca en User y en Auth, sin importar mayúsculas. */
export async function idCuentaPorEmail(prisma: Db, email: string): Promise<string | null> {
  const norm = normalizarEmail(email);
  if (!norm) return null;

  const publico = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id FROM "User" WHERE lower(email) = ${norm} LIMIT 1
  `;
  if (publico[0]?.id) return publico[0].id;

  const auth = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id FROM auth.users WHERE lower(email) = ${norm} LIMIT 1
  `;
  return auth[0]?.id ?? null;
}
