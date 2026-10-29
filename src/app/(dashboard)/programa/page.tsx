import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { ProgramaEditor } from "./ProgramaEditor";
import { normalizarTipoLocal } from "@/lib/planes";

export default async function ProgramaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });
  if (dbUser?.rol !== "asesor" && dbUser?.rol !== "admin_nucleo") redirect("/");

  const cookieStore = await cookies();
  const tenantCookie = cookieStore.get("tenant_activo")?.value;
  const locales =
    dbUser.rol === "admin_nucleo"
      ? await prisma.tenant.findMany({
          where: { estado: "activo" },
          select: { id: true, nombre: true, tipo_local: true },
          orderBy: { nombre: "asc" },
        })
      : (
          await prisma.asignacionAsesor.findMany({
            where: { asesor_id: user.id, activo: true, tenant: { estado: { not: "baja" } } },
            select: { tenant: { select: { id: true, nombre: true, tipo_local: true } } },
            orderBy: { tenant: { nombre: "asc" } },
          })
        ).map((fila) => fila.tenant);
  const tenant = locales.find((local) => local.id === tenantCookie) ?? locales[0] ?? null;

  return (
    <ProgramaEditor
      key={tenant?.id ?? "sin-local"}
      localNombre={tenant?.nombre ?? null}
      tenantId={tenant?.id ?? null}
      tipoLocal={normalizarTipoLocal(tenant?.tipo_local)}
    />
  );
}
