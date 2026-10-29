import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { CONTACTO_SOPORTE } from "@/lib/branding";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <dt className="text-sm text-[#5B6980]">{etiqueta}</dt>
      <dd className="text-sm font-medium text-[#0B1B33]">{valor ?? <span className="text-[#5B6980]">Por definir</span>}</dd>
    </div>
  );
}

export default async function SoportePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } });
  const cookieStore = await cookies();
  let tenantId = cookieStore.get("tenant_activo")?.value ?? null;
  if (!tenantId) {
    const membresia = await prisma.userTenant.findFirst({ where: { user_id: user.id }, select: { tenant_id: true } });
    tenantId = membresia?.tenant_id ?? null;
  }

  const esLocal = dbUser?.rol !== "asesor" && dbUser?.rol !== "admin_nucleo";
  const asignacion =
    tenantId && esLocal
      ? await prisma.asignacionAsesor.findFirst({
          where: { tenant_id: tenantId, activo: true },
          select: { asesor_id: true },
        })
      : null;
  const asesor = asignacion
    ? await prisma.user.findUnique({ where: { id: asignacion.asesor_id }, select: { nombre: true, email: true } })
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Soporte</h1>
        <p className="text-sm text-[#5B6980] mt-1">Cómo contactar a tu asesor y al equipo de Núcleo 24H.</p>
      </div>

      {esLocal && (
        <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#0B1B33]">Tu asesor</h2>
          {asesor ? (
            <p className="mt-1 text-sm text-[#334155]">
              {asesor.nombre} · {asesor.email}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[#5B6980]">Este local aún no tiene un asesor asignado.</p>
          )}
          <Link
            href="/comunicaciones"
            className="mt-3 inline-flex items-center min-h-10 px-4 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] focus-visible:ring-offset-2"
          >
            Escribir en Mensajes
          </Link>
        </section>
      )}

      <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#0B1B33]">Casa central</h2>
        <dl className="mt-2">
          <Dato etiqueta="WhatsApp" valor={CONTACTO_SOPORTE.whatsapp} />
          <Dato etiqueta="Correo" valor={CONTACTO_SOPORTE.correo} />
          <Dato etiqueta="Horario de atención" valor={CONTACTO_SOPORTE.horario} />
        </dl>
      </section>
    </div>
  );
}
