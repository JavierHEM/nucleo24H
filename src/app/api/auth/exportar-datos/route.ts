import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const cookieStore = await cookies();
  const tenantActivo = cookieStore.get("tenant_activo")?.value;

  const [dbUser, registros, documentos, mensajes, consentimientos] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { id: true, nombre: true, email: true, rol: true, created_at: true } }),
    prisma.registro.findMany({ where: { created_by: user.id }, select: { tipo: true, fecha: true, datos: true, estado: true, created_at: true } }),
    prisma.documento.findMany({ where: { created_by: user.id }, select: { nombre: true, categoria: true, mes: true, estado: true, created_at: true } }),
    prisma.mensaje.findMany({ where: { de: user.id, ...(tenantActivo ? { tenant_id: tenantActivo } : {}) }, select: { contenido: true, created_at: true, leido: true } }),
    prisma.consentimiento.findMany({ where: { titular_id: user.id }, select: { tipo: true, documento_version: true, timestamp_evento: true, ip_origen: true } }),
  ]);

  const exportacion = {
    exportado_el: new Date().toISOString(),
    ley: "Ley 21.719 — Protección de Datos Personales (Chile)",
    usuario: dbUser,
    registros_bpm: registros,
    documentos: documentos,
    mensajes: mensajes,
    consentimientos: consentimientos,
  };

  return new NextResponse(JSON.stringify(exportacion, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mis-datos-nucleosur-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
