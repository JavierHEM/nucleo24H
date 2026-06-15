import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { getPresignedUploadUrl, getPublicUrl, buildDocKey } from "@/lib/storage/r2";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_MB = 10;

const bodySchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1),
  sizeMb: z.number().positive().max(MAX_MB),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { filename, contentType, sizeMb } = parsed.data;

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      {
        error: `Tipo de archivo no permitido. Se aceptan: ${ALLOWED_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Obtener tenant activo del usuario
  const cookieTenantId = req.cookies.get("tenant_activo")?.value;
  const userTenants = await prisma.userTenant.findMany({
    where: { user_id: user.id },
    select: { tenant_id: true },
  });

  const tenantId =
    cookieTenantId && userTenants.some((ut) => ut.tenant_id === cookieTenantId)
      ? cookieTenantId
      : userTenants[0]?.tenant_id;

  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant asignado" }, { status: 403 });
  }

  const key = buildDocKey({ tenantId, filename });
  const uploadUrl = await getPresignedUploadUrl({
    key,
    contentType,
    maxSizeMb: sizeMb,
  });

  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
