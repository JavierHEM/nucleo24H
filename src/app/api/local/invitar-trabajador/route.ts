import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";
import { syncUserClaims } from "@/lib/supabase/claims";
import { sendInvitacionLocal } from "@/lib/email/sendInvitacion";
import { APP_NAME } from "@/lib/branding";
import { enlaceDeAcceso } from "@/lib/auth/enlaceInvitacion";
import { debePromoverRol, puedeGestionarEquipo, puedeInvitarConRol } from "@/lib/roles";

const bodySchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Ingresa el nombre").optional(),
  rol: z.enum(["trabajador_local", "jefe_local", "admin_local"]).default("trabajador_local"),
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

  if (!puedeGestionarEquipo(dbUser?.rol)) {
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

  if (!puedeInvitarConRol(dbUser?.rol, rol)) {
    return NextResponse.json(
      { error: "No puedes asignar ese rol." },
      { status: 403 }
    );
  }

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

    const cuenta = await prisma.user.findUnique({
      where: { id: existingUserId },
      select: { rol: true },
    });
    if (cuenta && debePromoverRol(cuenta.rol, rol)) {
      await prisma.user.update({
        where: { id: existingUserId },
        data: { rol },
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

  // Caso 2: nuevo usuario → generar link y enviar email brandedizado
  const supabaseAdmin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nucleo-mu.vercel.app";

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { nombre: true },
  });

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: {
          tenant_id: tenantId,
          rol,
          ...(nombre ? { nombre } : {}),
        },
      },
    });

  if (linkError || !linkData.user) {
    console.error("[invitar-trabajador] Error generando link:", linkError);
    return NextResponse.json(
      { error: `Error al enviar invitación: ${linkError?.message ?? "desconocido"}` },
      { status: 500 }
    );
  }

  await syncUserClaims(linkData.user.id);

  // Obtener datos del invitador para el email
  const invitador = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nombre: true, email: true },
  });
  const invitadoPor = invitador?.nombre ?? invitador?.email ?? APP_NAME;
  const linkAcceso = enlaceDeAcceso(appUrl, linkData.properties, "/onboarding");
  if (!linkAcceso) {
    return NextResponse.json({ error: "No se pudo armar el enlace de invitación." }, { status: 500 });
  }

  void sendInvitacionLocal({
    to: email,
    nombre: nombre ?? email,
    nombreLocal: tenant?.nombre ?? "el local",
    rol,
    invitadoPor,
    linkAcceso,
  }).catch((err) => console.error("[invitar-trabajador] Error Resend:", err));

  return NextResponse.json({
    success: true,
    message: `Invitación enviada a ${email} para unirse a "${tenant?.nombre}".`,
  });
}
