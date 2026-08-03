import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { cookies } from "next/headers";
import { IconMedal } from "@tabler/icons-react";
import Link from "next/link";
import { SelloActual } from "./SelloActual";
import { HistorialSellos } from "./HistorialSellos";
import { EmitirSelloButton } from "./EmitirSelloButton";
import { DescargarPdfButton } from "./DescargarPdfButton";
import { RevisionesPanel } from "./RevisionesPanel";
import { getCurrentPeriodo } from "@/lib/utils";
import type { UserRole } from "@/server/trpc/context";

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nucleosur.cl";

  // Obtener el id del sello actual para el link de certificado público
  const periodo = getCurrentPeriodo();
  const selloActualDb = tenantActivo
    ? await prisma.sello.findUnique({
        where: {
          tenant_id_periodo: { tenant_id: tenantActivo, periodo },
        },
        select: { id: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] flex items-center gap-2">
            <IconMedal size={26} className="text-[#4B8B2E]" />
            Sello de Cumplimiento
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Seguimiento del nivel de cumplimiento BPM
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {selloActualDb && (
            <Link
              href={`${appUrl}/sello/${selloActualDb.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#64748B] hover:text-[#0B2545] border border-[#E2E8F0] rounded-lg px-3 py-1.5 hover:bg-[#F8F9FA] transition-colors"
            >
              Ver certificado público →
            </Link>
          )}
          {tenantActivo && (
            <DescargarPdfButton tenantId={tenantActivo} periodo={getCurrentPeriodo()} />
          )}
          {canEmitir && tenantActivo && (
            <EmitirSelloButton tenantId={tenantActivo} />
          )}
        </div>
      </div>

      {/* Revisiones pendientes — solo visible para asesor/admin_nucleo */}
      {canEmitir && <RevisionesPanel />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SelloActual userRole={userRole} />
        </div>
        <div className="lg:col-span-2">
          <HistorialSellos />
        </div>
      </div>
    </div>
  );
}
