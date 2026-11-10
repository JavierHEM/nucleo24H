import { createAdminClient } from "@/lib/supabase/admin";
import { syncUserClaims } from "@/lib/supabase/claims";
import { sendInvitacionLocal } from "@/lib/email/sendInvitacion";
import { enlaceDeAcceso, redirectInvitacion } from "@/lib/auth/enlaceInvitacion";
import { normalizarEmail } from "@/lib/auth/email";
import { idCuentaPorEmail } from "@/server/usuarios/porEmail";
import { APP_NAME, getAppUrl } from "@/lib/branding";
import { prisma } from "@/server/db/prisma";

export async function invitarAdminLocal(args: {
  tenantId: string;
  tenantNombre: string;
  email: string;
  invitadorId: string;
}) {
  const email = normalizarEmail(args.email);
  const existingUserId = await idCuentaPorEmail(prisma, email);

  if (existingUserId) {
    await prisma.userTenant.upsert({
      where: {
        user_id_tenant_id: { user_id: existingUserId, tenant_id: args.tenantId },
      },
      create: { user_id: existingUserId, tenant_id: args.tenantId },
      update: {},
    });
    await syncUserClaims(existingUserId);
    return {
      userId: existingUserId,
      invitado: false,
      message: `Local "${args.tenantNombre}" vinculado a la cuenta existente de ${email}.`,
    };
  }

  const supabaseAdmin = createAdminClient();
  const appUrl = getAppUrl();
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { nombre: email.split("@")[0] ?? email },
      redirectTo: redirectInvitacion(appUrl),
    },
  });

  const linkAcceso = enlaceDeAcceso(appUrl, linkData?.properties, "/");
  if (linkError && /already|registered|exists/i.test(linkError.message ?? "")) {
    const idExistente = await idCuentaPorEmail(prisma, email);
    if (idExistente) {
      await prisma.userTenant.upsert({
        where: {
          user_id_tenant_id: { user_id: idExistente, tenant_id: args.tenantId },
        },
        create: { user_id: idExistente, tenant_id: args.tenantId },
        update: {},
      });
      await syncUserClaims(idExistente);
      return {
        userId: idExistente,
        invitado: false,
        message: `Local "${args.tenantNombre}" vinculado a la cuenta existente de ${email}.`,
      };
    }
  }

  if (linkError || !linkData?.user || !linkAcceso) {
    throw new Error(`Error al enviar invitación: ${linkError?.message ?? "desconocido"}`);
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
      user_id_tenant_id: { user_id: linkData.user.id, tenant_id: args.tenantId },
    },
    create: { user_id: linkData.user.id, tenant_id: args.tenantId },
    update: {},
  });
  await syncUserClaims(linkData.user.id);

  const invitador = await prisma.user.findUnique({
    where: { id: args.invitadorId },
    select: { nombre: true, email: true },
  });

  void sendInvitacionLocal({
    to: email,
    nombre: email.split("@")[0] ?? email,
    nombreLocal: args.tenantNombre,
    rol: "admin_local",
    invitadoPor: invitador?.nombre ?? invitador?.email ?? APP_NAME,
    linkAcceso,
  }).catch((err) => console.error("[invitarAdminLocal] Error Resend:", err));

  return {
    userId: linkData.user.id,
    invitado: true,
    message: `Invitación enviada a ${email}. El enlace abre la creación de su clave.`,
  };
}
