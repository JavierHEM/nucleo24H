import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { normalizarEmail } from "@/lib/auth/email";
import { invitarAdminLocal } from "@/server/locales/invitarAdminLocal";

const bodySchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email("Email inválido").transform((valor) => normalizarEmail(valor)),
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
    select: { rol: true },
  });

  if (dbUser?.rol !== "admin_nucleo") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Indica el local y un email válido." },
      { status: 400 }
    );
  }

  const local = await prisma.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, nombre: true },
  });
  if (!local) {
    return NextResponse.json({ error: "Local no encontrado." }, { status: 404 });
  }

  try {
    const resultado = await invitarAdminLocal({
      tenantId: local.id,
      tenantNombre: local.nombre,
      email: parsed.data.email,
      invitadorId: user.id,
    });
    return NextResponse.json({ success: true, ...resultado });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al invitar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
