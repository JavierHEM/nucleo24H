import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";

const bodySchema = z.object({
  nombre: z.string().min(2).max(100),
});

/**
 * Sincroniza el nombre (y cualquier otro dato de perfil futuro) del usuario
 * en public.User después de que completa el onboarding.
 */
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
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: { nombre: parsed.data.nombre },
    create: {
      id: user.id,
      email: user.email ?? "",
      nombre: parsed.data.nombre,
      rol: (user.app_metadata?.rol as string | undefined) ?? "trabajador_local",
    },
  });

  return NextResponse.json({ ok: true });
}
