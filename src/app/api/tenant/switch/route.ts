import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";

const bodySchema = z.object({
  tenantId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "tenantId inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // admin_nucleo puede cambiar a cualquier tenant sin restricción
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });

  if (dbUser?.rol !== "admin_nucleo") {
    // Para otros roles: verificar acceso al tenant via claims o BD
    const tenants = (user.app_metadata?.tenants as string[]) ?? [];
    if (!tenants.includes(parsed.data.tenantId)) {
      const membership = await prisma.userTenant.findUnique({
        where: {
          user_id_tenant_id: {
            user_id: user.id,
            tenant_id: parsed.data.tenantId,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
    }
  }

  const response = NextResponse.json({ ok: true });
  // Guardar el tenant activo en cookie (httpOnly, mismo dominio)
  response.cookies.set("tenant_activo", parsed.data.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  return response;
}
