import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";

const bodySchema = z.object({
  peso_documentacion: z.number().min(0).max(1),
  peso_condiciones: z.number().min(0).max(1),
  peso_capacitaciones: z.number().min(0).max(1),
  peso_tareas: z.number().min(0).max(1),
  umbral_intermedio: z.number().min(0).max(100),
  umbral_avanzado: z.number().min(0).max(100),
  umbral_premium: z.number().min(0).max(100),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar que sea admin_nucleo
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
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  // Crear nueva configuración (histórico inmutable)
  const config = await prisma.configuracionSellos.create({
    data: {
      ...parsed.data,
      updated_by: user.id,
    },
  });

  return NextResponse.json({ ok: true, id: config.id });
}
