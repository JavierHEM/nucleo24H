import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { crearUrlDeLectura } from "@/lib/storage/archivos";
import { parseRuta } from "@/lib/storage/rutas";

export async function GET(req: NextRequest) {
  const ruta = req.nextUrl.searchParams.get("ruta") ?? "";
  const parsed = parseRuta(ruta);
  if (!parsed) {
    return NextResponse.json({ error: "Archivo no válido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const permitido = await puedeLeer(user.id, parsed.tenantId);
  if (!permitido) {
    return NextResponse.json({ error: "Sin permisos para ver este archivo" }, { status: 403 });
  }

  const signedUrl = await crearUrlDeLectura(ruta);
  if (!signedUrl) {
    return NextResponse.json({ error: "No se pudo abrir el archivo" }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl);
}

async function puedeLeer(userId: string, tenantId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { rol: true, activo: true },
  });
  if (!dbUser?.activo) return false;
  if (dbUser.rol === "admin_nucleo") return true;

  if (dbUser.rol === "asesor") {
    const asignacion = await prisma.asignacionAsesor.findFirst({
      where: { asesor_id: userId, tenant_id: tenantId, activo: true },
      select: { id: true },
    });
    return Boolean(asignacion);
  }

  if (dbUser.rol === "jefe_local" || dbUser.rol === "admin_local" || dbUser.rol === "trabajador_local") {
    const membresia = await prisma.userTenant.findFirst({
      where: { user_id: userId, tenant_id: tenantId },
      select: { id: true },
    });
    return Boolean(membresia);
  }

  return false;
}
