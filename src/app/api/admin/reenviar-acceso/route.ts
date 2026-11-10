import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { sendInvitacionLocal } from "@/lib/email/sendInvitacion";
import { enlaceDeAcceso } from "@/lib/auth/enlaceInvitacion";
import { APP_NAME } from "@/lib/branding";
import { generarLinkAcceso } from "@/server/usuarios/generarLinkAcceso";

const bodySchema = z.object({
  tenantId: z.string().uuid(),
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
    select: { rol: true, nombre: true, email: true },
  });
  if (dbUser?.rol !== "admin_nucleo") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Local inválido" }, { status: 400 });
  }

  const { tenantId } = parsed.data;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, nombre: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
  }

  const pendientes = await prisma.$queryRaw<
    Array<{ id: string; email: string; email_confirmado: boolean }>
  >`
    SELECT
      au.id::text,
      au.email,
      au.email_confirmed_at IS NOT NULL AS email_confirmado
    FROM auth.users au
    WHERE (
      au.raw_user_meta_data->>'tenant_id' = ${tenantId}
      OR au.id IN (
        SELECT ut.user_id
        FROM "UserTenant" ut
        JOIN "User" u ON u.id = ut.user_id
        WHERE ut.tenant_id = ${tenantId}::uuid
          AND u.rol = 'admin_local'
      )
    )
      AND COALESCE(au.raw_user_meta_data->>'clave_definida', '') <> 'true'
    LIMIT 1
  `;
  const dueño = pendientes[0];
  if (!dueño?.email) {
    return NextResponse.json(
      { error: "Esa persona ya creó su clave. Puede iniciar sesión." },
      { status: 409 }
    );
  }

  const { appUrl, properties, error: linkError } = await generarLinkAcceso({
    email: dueño.email,
    emailConfirmado: Boolean(dueño.email_confirmado),
  });
  const linkAcceso = enlaceDeAcceso(appUrl, properties, "/");
  if (linkError || !linkAcceso) {
    console.error("[reenviar-acceso] Error generando link:", linkError);
    return NextResponse.json(
      { error: linkError?.message ?? "No se pudo reenviar el acceso." },
      { status: 500 }
    );
  }

  await sendInvitacionLocal({
    to: dueño.email,
    nombre: dueño.email.split("@")[0] ?? dueño.email,
    nombreLocal: tenant.nombre,
    rol: "admin_local",
    invitadoPor: dbUser.nombre ?? dbUser.email ?? APP_NAME,
    linkAcceso,
  });

  return NextResponse.json({
    success: true,
    message: `Reenviamos el acceso a ${dueño.email}. El enlace abre la creación de su clave.`,
  });
}
