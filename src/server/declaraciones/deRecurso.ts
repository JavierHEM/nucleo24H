import {
  armarConstancias,
  type ConstanciaConsultable,
  type RecursoConstancia,
} from "@/lib/declaraciones/constancia";

export async function constanciasDeRecurso(
  prisma: typeof import("@/server/db/prisma").prisma,
  tenantId: string,
  recursoTipo: RecursoConstancia,
  recursoId: string
): Promise<ConstanciaConsultable[]> {
  const filas = await prisma.declaracionVeracidad.findMany({
    where: {
      tenant_id: tenantId,
      recurso_tipo: recursoTipo,
      recurso_id: recursoId,
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      tipo: true,
      version: true,
      texto: true,
      evento: true,
      created_at: true,
      user_id: true,
    },
  });
  if (filas.length === 0) return [];

  const usuarios = await prisma.user.findMany({
    where: { id: { in: [...new Set(filas.map((fila) => fila.user_id))] } },
    select: { id: true, nombre: true },
  });
  const firmantes = Object.fromEntries(usuarios.map((usuario) => [usuario.id, usuario.nombre]));
  return armarConstancias(filas, firmantes);
}
