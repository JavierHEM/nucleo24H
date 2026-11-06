import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { cookies } from "next/headers";
import { IconMedal } from "@tabler/icons-react";
import Link from "next/link";
import { SelloActual } from "./SelloActual";
import { HistorialSellos } from "./HistorialSellos";
import { EmitirSelloButton } from "./EmitirSelloButton";
import { DescargarPdfButton } from "./DescargarPdfButton";
import { DescargarInformeButton } from "./DescargarInformeButton";
import { RevisionesPanel } from "./RevisionesPanel";
import { ColaPropuestos } from "./ColaPropuestos";
import { getCurrentPeriodo } from "@/lib/utils";
import type { UserRole } from "@/server/trpc/context";
import { getAppUrl } from "@/lib/branding";

export default async function SellosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user?.id ?? "" },
    select: { rol: true },
  });

  const userRole = (dbUser?.rol as UserRole | undefined) ?? null;

  const cookieStore = await cookies();
  const tenantActivo = cookieStore.get("tenant_activo")?.value ?? null;

  const canEmitir = userRole === "asesor" || userRole === "admin_nucleo";
  const appUrl = getAppUrl();

  const selloVigenteDb = tenantActivo
    ? await prisma.sello.findFirst({
        where: { tenant_id: tenantActivo, estado: "emitido" },
        orderBy: { periodo: "desc" },
        select: { id: true, periodo: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconMedal size={26} className="text-[#2F6B2A]" />
            Sello de Cumplimiento
          </h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Se muestra el último sello emitido. El del mes en curso se calcula al cierre.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {selloVigenteDb && (
            <Link
              href={`${appUrl}/sello/${selloVigenteDb.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#5B6980] hover:text-[#0B1B33] border border-[#DDE3EA] rounded-lg px-3 py-1.5 hover:bg-[#F4F6F3] transition-colors"
            >
              Ver certificado público →
            </Link>
          )}
          {tenantActivo && (
            <>
              <DescargarInformeButton periodo={selloVigenteDb?.periodo ?? getCurrentPeriodo()} />
              <DescargarPdfButton tenantId={tenantActivo} periodo={selloVigenteDb?.periodo ?? getCurrentPeriodo()} />
            </>
          )}
          {canEmitir && tenantActivo && (
            <EmitirSelloButton tenantId={tenantActivo} puedeAprobar={userRole === "admin_nucleo"} />
          )}
        </div>
      </div>

      {userRole === "admin_nucleo" && <ColaPropuestos />}
      {canEmitir && <RevisionesPanel />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SelloActual userRole={userRole} />
        </div>
        <div className="lg:col-span-1">
          <HistorialSellos />
        </div>
      </div>
    </div>
  );
}
