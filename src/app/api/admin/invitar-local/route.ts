import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";
import { syncUserClaims } from "@/lib/supabase/claims";

const bodySchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Ingresa el nombre del local"),
  rut: z.string().min(8, "RUT inválido").max(12),
  plan: z.enum(["calidad", "integral"]).default("calidad"),
  direccion: z.string().optional(),
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
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, nombre, rut, plan, direccion } = parsed.data;

  // El RUT identifica a la empresa: si ya existe, el local nuevo es una
  // sucursal y debe crearse desde "Agregar sucursal" en el local existente.
  const rutExistente = await prisma.tenant.findFirst({
    where: { rut },
    orderBy: { created_at: "asc" },
  });
  if (rutExistente) {
    return NextResponse.json(
      {
        error: `El RUT ${rut} ya pertenece a "${rutExistente.nombre}". Para agregar otro local de la misma empresa, usa "Agregar sucursal" en la fila de ese local.`,
      },
      { status: 409 }
    );
  }

  // ¿El email ya tiene cuenta? → vincular el local nuevo, sin re-invitar
  const existingAuthUsers = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM auth.users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  const existingUserId = existingAuthUsers[0]?.id ?? null;

  const tenant = await prisma.tenant.create({
    data: {
      nombre,
      rut,
      plan,
      estado: "activo",
      direccion: direccion ?? "",
    },
  });

  // Caso 1: usuario existente → solo vincular (multi-local)
  if (existingUserId) {
    await prisma.userTenant.upsert({
      where: {
        user_id_tenant_id: { user_id: existingUserId, tenant_id: tenant.id },
      },
      create: { user_id: existingUserId, tenant_id: tenant.id },
      update: {},
    });

    await syncUserClaims(existingUserId);

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      message: `Local "${nombre}" vinculado a la cuenta existente de ${email}.`,
    });
  }

  // Caso 2: usuario nuevo → invitar; el trigger handle_new_user
  // vinculará el tenant_id que va en la metadata.
  const supabaseAdmin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nucleosur.cl";

  const { data: inviteData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/api/auth/callback?next=/`,
      data: {
        tenant_id: tenant.id,
        rol: "admin_local",
      },
    });

  if (inviteError || !inviteData.user) {
    await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    console.error("[invitar-local] Error Supabase invite:", inviteError);
    return NextResponse.json(
      { error: `Error al enviar invitación: ${inviteError?.message ?? "desconocido"}` },
      { status: 500 }
    );
  }

  await syncUserClaims(inviteData.user.id);

  return NextResponse.json({
    success: true,
    tenantId: tenant.id,
    message: `Invitación enviada a ${email}.`,
  });
}
