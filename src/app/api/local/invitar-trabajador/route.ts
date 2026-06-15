import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";
import { syncUserClaims } from "@/lib/supabase/claims";

const bodySchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Ingresa el nombre").optional(),
  rol: z.enum(["trabajador_local", "admin_local"]).default("trabajador_local"),
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

  if (dbUser?.rol !== "admin_local" && dbUser?.rol !== "admin_nucleo") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  // Determinar tenant activo
  const cookieStore = await cookies();
  const tenantActivoCookie = cookieStore.get("tenant_activo")?.value;

  const userTenants = await prisma.userTenant.findMany({
    where: { user_id: user.id },
    select: { tenant_id: true },
  });
  const tenantIds = userTenants.map((ut) => ut.tenant_id);

  const tenantId =
    tenantActivoCookie && tenantIds.includes(tenantActivoCookie)
      ? tenantActivoCookie
      : tenantIds[0];

  if (!tenantId) {
    return NextResponse.json({ error: "Sin local asociado" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, nombre, rol } = parsed.data;

  // ¿El email ya tiene cuenta en auth.users?
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM auth.users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  const existingUserId = existing[0]?.id ?? null;

  // Caso 1: usuario ya existe → vincular al tenant si no está
  if (existingUserId) {
    const existeVinculo = await prisma.userTenant.findUnique({
      where: {
        user_id_tenant_id: { user_id: existingUserId, tenant_id: tenantId },
      },
    });

    if (existeVinculo) {
      return NextResponse.json(
        { error: "Ese usuario ya es miembro de este local." },
        { status: 409 }
      );
    }

    // Si el rol pedido es admin_local, actualizar también User.rol
    if (rol === "admin_local") {
      await prisma.user.update({
        where: { id: existingUserId },
        data: { rol: "admin_local" },
      });
    }

    await prisma.userTenant.create({
      data: { user_id: existingUserId, tenant_id: tenantId },
    });

    await syncUserClaims(existingUserId);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nombre: true },
    });

    return NextResponse.json({
      success: true,
      message: `Cuenta existente vinculada al local "${tenant?.nombre}".`,
    });
  }

  // Caso 2: nuevo usuario → invitar por email
  const supabaseAdmin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nucleosur.cl";

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { nombre: true },
  });

  const { data: inviteData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/onboarding?next=/`,
      data: {
        tenant_id: tenantId,
        rol,
        ...(nombre ? { nombre } : {}),
      },
    });

  if (inviteError || !inviteData.user) {
    console.error("[invitar-trabajador] Error Supabase invite:", inviteError);
    return NextResponse.json(
      { error: `Error al enviar invitación: ${inviteError?.message ?? "desconocido"}` },
      { status: 500 }
    );
  }

  await syncUserClaims(inviteData.user.id);

  return NextResponse.json({
    success: true,
    message: `Invitación enviada a ${email} para unirse a "${tenant?.nombre}".`,
  });
}
