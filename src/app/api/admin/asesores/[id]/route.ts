import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";

const bodySchema = z
  .object({
    nombre: z.string().trim().min(2, "Nombre requerido").max(120).optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => data.nombre !== undefined || data.activo !== undefined, {
    message: "Nada que actualizar",
  });

const BAN_DURATION = "876000h";

async function requireAdminNucleo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });

  if (dbUser?.rol !== "admin_nucleo") {
    return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) };
  }

  return { userId: user.id };
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminNucleo();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Asesor inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const mensaje = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  const asesor = await prisma.user.findFirst({
    where: { id, rol: "asesor" },
    select: { id: true, activo: true },
  });

  if (!asesor) {
    return NextResponse.json({ error: "Asesor no encontrado" }, { status: 404 });
  }

  const { nombre, activo } = parsed.data;
  const admin = createAdminClient();

  if (nombre !== undefined) {
    await prisma.user.update({ where: { id }, data: { nombre } });
    const { error } = await admin.auth.admin.updateUserById(id, {
      user_metadata: { nombre },
    });
    if (error) {
      console.error("[asesores] No se pudo actualizar el nombre en Auth:", error.message);
    }
  }

  if (activo === false && asesor.activo) {
    const asignaciones = await prisma.asignacionAsesor.findMany({
      where: { asesor_id: id, activo: true },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { activo: false } }),
      prisma.asignacionAsesor.updateMany({
        where: { asesor_id: id, activo: true },
        data: { activo: false },
      }),
    ]);

    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: BAN_DURATION,
    });

    if (error) {
      await prisma.$transaction([
        prisma.user.update({ where: { id }, data: { activo: true } }),
        prisma.asignacionAsesor.updateMany({
          where: { id: { in: asignaciones.map((a) => a.id) } },
          data: { activo: true },
        }),
      ]);
      console.error("[asesores] Error al dar de baja en Auth:", error.message);
      return NextResponse.json(
        { error: "No se pudo dar de baja la cuenta. Intenta de nuevo." },
        { status: 500 }
      );
    }
  }

  if (activo === true && !asesor.activo) {
    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (error) {
      console.error("[asesores] Error al reactivar en Auth:", error.message);
      return NextResponse.json(
        { error: "No se pudo reactivar la cuenta. Intenta de nuevo." },
        { status: 500 }
      );
    }
    await prisma.user.update({ where: { id }, data: { activo: true } });
  }

  const actualizado = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nombre: true, email: true, activo: true },
  });

  return NextResponse.json({ ok: true, asesor: actualizado });
}
