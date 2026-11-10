import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { normalizarEmail } from "@/lib/auth/email";
import { ErrorReenvio, reenviarInvitacion } from "@/server/usuarios/reenviarInvitacion";

const bodySchema = z
  .object({
    userId: z.string().uuid().optional(),
    email: z
      .string()
      .email()
      .transform((valor) => normalizarEmail(valor))
      .optional(),
  })
  .refine((valor) => Boolean(valor.userId || valor.email), {
    message: "Indica el correo o la cuenta.",
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

  try {
    const resultado = await reenviarInvitacion({
      userId: parsed.data.userId,
      email: parsed.data.email,
      invitadorNombre: dbUser.nombre ?? dbUser.email ?? "Núcleo 24H",
    });
    return NextResponse.json({ success: true, message: resultado.message, email: resultado.email });
  } catch (error) {
    if (error instanceof ErrorReenvio) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[reenviar-invitacion]", error);
    return NextResponse.json({ error: "No se pudo reenviar la invitación." }, { status: 500 });
  }
}
