import { type NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "trabajador_local"
  | "admin_local"
  | "asesor"
  | "admin_nucleo";

export type TRPCContext = {
  tenants: string[];        // todos los tenants del usuario
  tenantActivo: string | null; // tenant seleccionado actualmente
  userId: string | null;
  userRole: UserRole | null;
  prisma: typeof prisma;
  req?: NextRequest;
};

export async function createContext(req?: NextRequest): Promise<TRPCContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      tenants: [],
      tenantActivo: null,
      userId: null,
      userRole: null,
      prisma,
      req,
    };
  }

  // 1. Leer tenant_activo desde cookie de sesión (para multi-local)
  const tenantActivoCookie = req?.cookies.get("tenant_activo")?.value;

  // 2. Intentar desde app_metadata del JWT (rápido, no requiere DB)
  const metaTenants = user.app_metadata?.tenants as string[] | undefined;
  const metaRol = user.app_metadata?.rol as UserRole | undefined;

  // admin_nucleo no requiere tenants; el resto de roles sí
  if (metaRol && (metaRol === "admin_nucleo" || (metaTenants && metaTenants.length > 0))) {
    const tenants = metaTenants ?? [];
    const tenantActivo =
      tenantActivoCookie && tenants.includes(tenantActivoCookie)
        ? tenantActivoCookie
        : tenants[0] ?? null;

    return {
      tenants,
      tenantActivo,
      userId: user.id,
      userRole: metaRol,
      prisma,
      req,
    };
  }

  // 3. Fallback: buscar en BD con función SECURITY DEFINER
  try {
    const rows = await prisma.$queryRaw<
      Array<{ tenant_ids: string[]; rol: string }>
    >`SELECT * FROM get_user_context(${user.id}::uuid)`;

    if (rows.length > 0 && rows[0].rol) {
      const tenants = rows[0].tenant_ids ?? [];
      const tenantActivo =
        tenantActivoCookie && tenants.includes(tenantActivoCookie)
          ? tenantActivoCookie
          : tenants[0] ?? null;

      return {
        tenants,
        tenantActivo,
        userId: user.id,
        userRole: rows[0].rol as UserRole,
        prisma,
        req,
      };
    }
  } catch (err) {
    console.error("[context] Error en get_user_context:", err);
  }

  return {
    tenants: [],
    tenantActivo: null,
    userId: user.id,
    userRole: null,
    prisma,
    req,
  };
}
