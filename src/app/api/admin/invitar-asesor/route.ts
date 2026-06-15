import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";
import { sendInvitacionAsesor } from "@/lib/email/sendInvitacion";

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
  const adminSupabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nucleo-mu.vercel.app";

  // Generar link de invitación sin que Supabase envíe su propio email
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: `${appUrl}/api/auth/callback?next=/onboarding`,
      data: {
        nombre,
        rol: "asesor",
        is_asesor_invite: true,
      },
    },
  });

  if (linkError || !linkData.user) {
    console.error("[invitar-asesor] Error generando link:", linkError);
    return NextResponse.json(
      { error: linkError?.message ?? "No se pudo generar la invitación." },
      { status: 500 }
    );
  }

  // Crear o actualizar el User en la BD con rol asesor
  await prisma.user.upsert({
    where: { id: linkData.user.id },
    create: { id: linkData.user.id, email, nombre, rol: "asesor" },
    update: { nombre, rol: "asesor" },
  });

  // Enviar email brandedizado via Resend
  const invitadoPor = dbUser.nombre ?? dbUser.email ?? "Núcleo Sur";
  const linkAcceso = linkData.properties?.action_link ?? `${appUrl}/login`;

  void sendInvitacionAsesor({ to: email, nombre, invitadoPor, linkAcceso }).catch((err) =>
    console.error("[invitar-asesor] Error Resend:", err)
  );

  return NextResponse.json({ ok: true, user_id: linkData.user.id });
}
