import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { normalizarEmail } from "@/lib/auth/email";
import { syncUserClaims } from "@/lib/supabase/claims";

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

  const existente = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });
  const rol =
    existente?.rol ??
    (typeof user.app_metadata?.rol === "string" ? user.app_metadata.rol : "trabajador_local");

  await prisma.user.upsert({
    where: { id: user.id },
    update: { nombre: parsed.data.nombre },
    create: {
      id: user.id,
      email: user.email ? normalizarEmail(user.email) : "",
      nombre: parsed.data.nombre,
      rol,
    },
  });
  await syncUserClaims(user.id);

  return NextResponse.json({ ok: true });
}
