import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";

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
    select: { rol: true },
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

  // Invitar usuario vía magic link de Supabase con rol asesor
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/onboarding`,
      data: {
        nombre,
        rol: "asesor",
        is_asesor_invite: true,
      },
    }
  );

  if (inviteError) {
    console.error("[invitar-asesor] Error Supabase invite:", inviteError);
    return NextResponse.json(
      { error: inviteError.message ?? "No se pudo enviar la invitación." },
      { status: 500 }
    );
  }

  // Crear o actualizar el User en la BD con rol asesor
  await prisma.user.upsert({
    where: { id: inviteData.user.id },
    create: {
      id: inviteData.user.id,
      email,
      nombre,
      rol: "asesor",
    },
    update: {
      nombre,
      rol: "asesor",
    },
  });

  return NextResponse.json({ ok: true, user_id: inviteData.user.id });
}
