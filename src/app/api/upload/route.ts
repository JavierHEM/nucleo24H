import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { puedeOperarLocal } from "@/lib/roles";
import { crearUrlDeCarga } from "@/lib/storage/archivos";
import { construirRuta, type BucketArchivo } from "@/lib/storage/rutas";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_MB = 10;

const bodySchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1),
  sizeMb: z.number().positive().max(MAX_MB),
  bucket: z.enum(["registros", "documentos"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true, activo: true },
  });

  if (!dbUser?.activo || !puedeOperarLocal(dbUser.rol)) {
    return NextResponse.json({ error: "Sin permisos para subir archivos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { filename, contentType, bucket } = parsed.data;
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa PDF, JPG, PNG o WebP." },
      { status: 400 }
    );
  }

  const cookieTenantId = req.cookies.get("tenant_activo")?.value;
  const tenantId = await resolverTenant(user.id, dbUser.rol, cookieTenantId);
  if (!tenantId) {
    return NextResponse.json({ error: "Selecciona un local antes de subir el archivo." }, { status: 403 });
  }

  const { path, ruta } = construirRuta(bucket as BucketArchivo, tenantId, filename);

  try {
    const uploadUrl = await crearUrlDeCarga(bucket, path);
    return NextResponse.json({ uploadUrl, ruta });
  } catch (error) {
    console.error("[upload] Error preparando la carga:", error);
    return NextResponse.json({ error: "No se pudo preparar la carga del archivo." }, { status: 500 });
  }
}

async function resolverTenant(userId: string, rol: string, cookieTenantId?: string) {
  if (rol === "admin_nucleo") {
    if (!cookieTenantId) return null;
    const tenant = await prisma.tenant.findFirst({
      where: { id: cookieTenantId, estado: { not: "baja" } },
      select: { id: true },
    });
    return tenant?.id ?? null;
  }

  const membresias = await prisma.userTenant.findMany({
    where: { user_id: userId },
    select: { tenant_id: true },
  });
  if (
    cookieTenantId &&
    membresias.some((membresia) => membresia.tenant_id === cookieTenantId)
  ) {
    return cookieTenantId;
  }
  return membresias[0]?.tenant_id ?? null;
}
