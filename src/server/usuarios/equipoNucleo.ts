import { prisma } from "@/server/db/prisma";

export type MiembroNucleo = {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  claveDefinida: boolean;
};

export async function listarEquipoNucleo(): Promise<MiembroNucleo[]> {
  const filas = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      nombre: string;
      activo: boolean;
      clave_definida: boolean;
    }>
  >`
    SELECT
      u.id::text AS id,
      u.email,
      u.nombre,
      u.activo,
      COALESCE(au.raw_user_meta_data->>'clave_definida', '') = 'true' AS clave_definida
    FROM "User" u
    LEFT JOIN auth.users au ON au.id = u.id
    WHERE u.rol = 'admin_nucleo'
    ORDER BY u.nombre ASC, u.email ASC
  `;

  return filas.map((fila) => ({
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    activo: fila.activo,
    claveDefinida: Boolean(fila.clave_definida),
  }));
}
