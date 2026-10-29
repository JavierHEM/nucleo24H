import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";
import { syncUserClaims } from "@/lib/supabase/claims";
import { sendInvitacionNucleo } from "@/lib/email/sendInvitacion";
import { APP_NAME, getAppUrl } from "@/lib/branding";
import { enlaceDeAcceso } from "@/lib/auth/enlaceInvitacion";

const bodySchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
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
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const nombre = parsed.data.nombre.trim();
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id FROM auth.users WHERE lower(email) = ${email} LIMIT 1
  `;
  if (existing[0]) {
    const cuenta = await prisma.user.findUnique({
      where: { id: existing[0].id },
      select: { rol: true },
    });
    if (cuenta?.rol === "admin_nucleo") {
      return NextResponse.json(
        { error: "Esa cuenta ya administra Núcleo." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Ese correo ya tiene una cuenta. Usa un correo nuevo." },
      { status: 409 }
    );
  }

  const adminSupabase = createAdminClient();
  const appUrl = getAppUrl();
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { nombre } },
  });

  if (linkError || !linkData.user) {
    console.error("[invitar-nucleo] Error generando link:", linkError);
    return NextResponse.json(
      { error: linkError?.message ?? "No se pudo generar la invitación." },
      { status: 500 }
    );
  }

  await prisma.user.upsert({
    where: { id: linkData.user.id },
    create: { id: linkData.user.id, email, nombre, rol: "admin_nucleo" },
    update: { nombre, rol: "admin_nucleo" },
  });
  await prisma.userTenant.deleteMany({ where: { user_id: linkData.user.id } });
  await syncUserClaims(linkData.user.id);

  const linkAcceso = enlaceDeAcceso(appUrl, linkData.properties, "/onboarding");
  if (!linkAcceso) {
    return NextResponse.json(
      { error: "No se pudo armar el enlace de invitación." },
      { status: 500 }
    );
  }

  const invitadoPor = dbUser.nombre ?? dbUser.email ?? APP_NAME;
  void sendInvitacionNucleo({ to: email, nombre, invitadoPor, linkAcceso }).catch((err) =>
    console.error("[invitar-nucleo] Error Resend:", err)
  );

  return NextResponse.json({ ok: true });
}
