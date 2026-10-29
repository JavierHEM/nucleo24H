import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/server/db/prisma";
import { syncUserClaims } from "@/lib/supabase/claims";
import { sendInvitacionLocal } from "@/lib/email/sendInvitacion";
import { enlaceDeAcceso } from "@/lib/auth/enlaceInvitacion";
import { APP_NAME, getAppUrl } from "@/lib/branding";
import { PLAN_IDS, TIPOS_LOCAL } from "@/lib/planes";

const bodySchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Ingresa el nombre del local"),
  rut: z.string().min(8, "RUT inválido").max(12),
  plan: z.enum(PLAN_IDS).default("calidad"),
  tipo_local: z.enum(TIPOS_LOCAL).default("restaurante"),
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

  const { email, nombre, rut, plan, tipo_local, direccion } = parsed.data;

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
      tipo_local,
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

  // Caso 2: usuario nuevo. El correo lo manda la app: el enlace de Supabase
  // deja la sesión en el fragmento y el dueño cae en el login.
  const supabaseAdmin = createAdminClient();
  const appUrl = getAppUrl();

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { nombre: email.split("@")[0] ?? email },
    },
  });

  const linkAcceso = enlaceDeAcceso(appUrl, linkData?.properties, "/onboarding");
  if (linkError || !linkData?.user || !linkAcceso) {
    await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    console.error("[invitar-local] Error generando link:", linkError);
    return NextResponse.json(
      { error: `Error al enviar invitación: ${linkError?.message ?? "desconocido"}` },
      { status: 500 }
    );
  }

  await prisma.user.upsert({
    where: { id: linkData.user.id },
    create: {
      id: linkData.user.id,
      email,
      nombre: email.split("@")[0] ?? email,
      rol: "admin_local",
    },
    update: {},
  });
  await prisma.userTenant.upsert({
    where: {
      user_id_tenant_id: { user_id: linkData.user.id, tenant_id: tenant.id },
    },
    create: { user_id: linkData.user.id, tenant_id: tenant.id },
    update: {},
  });
  await syncUserClaims(linkData.user.id);

  const invitador = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nombre: true, email: true },
  });

  void sendInvitacionLocal({
    to: email,
    nombre: email.split("@")[0] ?? email,
    nombreLocal: nombre,
    rol: "admin_local",
    invitadoPor: invitador?.nombre ?? invitador?.email ?? APP_NAME,
    linkAcceso,
  }).catch((err) => console.error("[invitar-local] Error Resend:", err));

  return NextResponse.json({
    success: true,
    tenantId: tenant.id,
    message: `Invitación enviada a ${email}. El enlace abre la creación de su clave.`,
  });
}
