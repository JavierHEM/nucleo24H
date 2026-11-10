import { createAdminClient } from "@/lib/supabase/admin";
import { enlaceDeAcceso, redirectInvitacion } from "@/lib/auth/enlaceInvitacion";
import { normalizarEmail } from "@/lib/auth/email";
import {
  esRolInvitacion,
  nextReenvioInvitacion,
  puedeReenviarInvitacion,
  tenantInvitacionLocal,
  type RolInvitacion,
} from "@/lib/auth/reenviarInvitacion";
import {
  sendInvitacionAsesor,
  sendInvitacionLocal,
  sendInvitacionNucleo,
} from "@/lib/email/sendInvitacion";
import { APP_NAME, getAppUrl } from "@/lib/branding";
import { prisma } from "@/server/db/prisma";
import { idCuentaPorEmail } from "@/server/usuarios/porEmail";

export class ErrorReenvio extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ErrorReenvio";
  }
}

type CuentaAuth = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  claveDefinida: boolean;
  metadataTenantId: string | null;
};

async function cuentaPorId(id: string): Promise<CuentaAuth | null> {
  const filas = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      nombre: string;
      rol: string;
      activo: boolean;
      clave_definida: boolean;
      metadataTenantId: string | null;
    }>
  >`
    SELECT
      u.id::text AS id,
      u.email,
      u.nombre,
      u.rol,
      u.activo,
      COALESCE(au.raw_user_meta_data->>'clave_definida', '') = 'true' AS clave_definida,
      au.raw_user_meta_data->>'tenant_id' AS "metadataTenantId"
    FROM "User" u
    LEFT JOIN auth.users au ON au.id = u.id
    WHERE u.id = ${id}::uuid
    LIMIT 1
  `;
  const fila = filas[0];
  if (!fila) return null;
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    rol: fila.rol,
    activo: fila.activo,
    claveDefinida: Boolean(fila.clave_definida),
    metadataTenantId: fila.metadataTenantId,
  };
}

async function vinculosLocal(userId: string) {
  return prisma.userTenant.findMany({
    where: { user_id: userId },
    select: { tenant: { select: { id: true, nombre: true } } },
    orderBy: { tenant: { created_at: "asc" } },
  });
}

async function enviarCorreo(args: {
  rol: RolInvitacion;
  to: string;
  nombre: string;
  invitadoPor: string;
  linkAcceso: string;
  nombreLocal?: string;
}) {
  if (args.rol === "admin_nucleo") {
    await sendInvitacionNucleo({
      to: args.to,
      nombre: args.nombre,
      invitadoPor: args.invitadoPor,
      linkAcceso: args.linkAcceso,
    });
    return;
  }
  if (args.rol === "asesor") {
    await sendInvitacionAsesor({
      to: args.to,
      nombre: args.nombre,
      invitadoPor: args.invitadoPor,
      linkAcceso: args.linkAcceso,
    });
    return;
  }
  await sendInvitacionLocal({
    to: args.to,
    nombre: args.nombre,
    nombreLocal: args.nombreLocal ?? "tu local",
    rol: args.rol,
    invitadoPor: args.invitadoPor,
    linkAcceso: args.linkAcceso,
  });
}

export async function reenviarInvitacion(args: {
  userId?: string;
  email?: string;
  invitadorNombre: string;
}) {
  const userId =
    args.userId ??
    (args.email ? await idCuentaPorEmail(prisma, normalizarEmail(args.email)) : null);

  if (!userId) {
    throw new ErrorReenvio("No hay una cuenta con ese correo.", 404);
  }

  const cuenta = await cuentaPorId(userId);
  if (!cuenta) {
    throw new ErrorReenvio("No hay una cuenta con ese correo.", 404);
  }
  if (!esRolInvitacion(cuenta.rol)) {
    throw new ErrorReenvio("Esa cuenta no recibe invitaciones de acceso.", 409);
  }
  if (!puedeReenviarInvitacion({ activo: cuenta.activo, claveDefinida: cuenta.claveDefinida })) {
    if (!cuenta.activo) {
      throw new ErrorReenvio("Esa cuenta está de baja. Reactívala antes de reenviar.", 409);
    }
    throw new ErrorReenvio("Esa persona ya creó su clave. Puede iniciar sesión.", 409);
  }

  let nombreLocal: string | undefined;
  if (cuenta.rol !== "admin_nucleo" && cuenta.rol !== "asesor") {
    const vinculos = await vinculosLocal(cuenta.id);
    const local = tenantInvitacionLocal(
      cuenta.metadataTenantId,
      vinculos.map((vinculo) => vinculo.tenant)
    );
    if (!local) {
      throw new ErrorReenvio("Esa cuenta no está vinculada a un local.", 409);
    }
    nombreLocal = local.nombre;
  }

  const admin = createAdminClient();
  const appUrl = getAppUrl();
  const next = nextReenvioInvitacion(cuenta.rol);
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: cuenta.email,
    options: { redirectTo: redirectInvitacion(appUrl) },
  });
  const linkAcceso = enlaceDeAcceso(appUrl, linkData?.properties, next);
  if (linkError || !linkAcceso) {
    console.error("[reenviar-invitacion] Error generando link:", linkError);
    throw new ErrorReenvio(linkError?.message ?? "No se pudo reenviar la invitación.", 500);
  }

  await enviarCorreo({
    rol: cuenta.rol,
    to: cuenta.email,
    nombre: cuenta.nombre || cuenta.email.split("@")[0] || cuenta.email,
    invitadoPor: args.invitadorNombre || APP_NAME,
    linkAcceso,
    nombreLocal,
  });

  return {
    email: cuenta.email,
    message: `Reenviamos el acceso a ${cuenta.email}. El enlace anterior deja de servir.`,
  };
}
