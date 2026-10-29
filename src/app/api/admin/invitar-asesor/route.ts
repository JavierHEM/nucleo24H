import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";
import { sendInvitacionAsesor } from "@/lib/email/sendInvitacion";
import { APP_NAME, getAppUrl } from "@/lib/branding";
import { enlaceDeAcceso } from "@/lib/auth/enlaceInvitacion";
import { syncUserClaims } from "@/lib/supabase/claims";

const bodySchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { nombre, email } = parsed.data;
  const emailNormalizado = email.toLowerCase();
  const adminSupabase = createAdminClient();
  const appUrl = getAppUrl();

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id FROM auth.users WHERE lower(email) = ${emailNormalizado} LIMIT 1
  `;
  if (existing[0]) {
    const cuenta = await prisma.user.findUnique({
      where: { id: existing[0].id },
      select: { rol: true },
    });
    if (cuenta?.rol === "asesor") {
      return NextResponse.json({ error: "Esa cuenta ya es de asesor." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Ese correo ya tiene una cuenta. Usa un correo nuevo." },
      { status: 409 }
    );
  }

  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "invite",
    email: emailNormalizado,
    options: { data: { nombre } },
  });

  if (linkError || !linkData.user) {
    console.error("[invitar-asesor] Error generando link:", linkError);
    return NextResponse.json(
      { error: linkError?.message ?? "No se pudo generar la invitación." },
      { status: 500 }
    );
  }

  await prisma.user.upsert({
    where: { id: linkData.user.id },
    create: { id: linkData.user.id, email: emailNormalizado, nombre, rol: "asesor" },
    update: { nombre, rol: "asesor" },
  });
  await prisma.userTenant.deleteMany({ where: { user_id: linkData.user.id } });
  await syncUserClaims(linkData.user.id);

  const invitadoPor = dbUser.nombre ?? dbUser.email ?? APP_NAME;
  const linkAcceso = enlaceDeAcceso(appUrl, linkData.properties, "/onboarding");
  if (!linkAcceso) {
    return NextResponse.json({ error: "No se pudo armar el enlace de invitación." }, { status: 500 });
  }

  void sendInvitacionAsesor({ to: emailNormalizado, nombre, invitadoPor, linkAcceso }).catch((err) =>
    console.error("[invitar-asesor] Error Resend:", err)
  );

  return NextResponse.json({ ok: true, user_id: linkData.user.id });
}
