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

  const tenant = await prisma.tenant.findFirst({
    where: { id: parsed.data.tenantId, estado: { not: "baja" } },
    select: { id: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Local no encontrado." }, { status: 404 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });

  if (dbUser?.rol !== "admin_nucleo") {
    const tenants = (user.app_metadata?.tenants as string[]) ?? [];
    const enJwt = tenants.includes(parsed.data.tenantId);
    const membership = enJwt
      ? true
      : Boolean(
          await prisma.userTenant.findUnique({
            where: {
              user_id_tenant_id: {
                user_id: user.id,
                tenant_id: parsed.data.tenantId,
              },
            },
            select: { id: true },
          })
        );
    const asignado =
      dbUser?.rol === "asesor"
        ? Boolean(
            await prisma.asignacionAsesor.findFirst({
              where: { asesor_id: user.id, tenant_id: parsed.data.tenantId, activo: true },
              select: { id: true },
            })
          )
        : false;

    if (!membership && !asignado) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("tenant_activo", parsed.data.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
