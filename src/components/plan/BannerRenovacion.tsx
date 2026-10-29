import Link from "next/link";
import { IconCalendarEvent } from "@tabler/icons-react";
import { prisma } from "@/server/db/prisma";
import { estadoContrato } from "@/lib/planes";
import { formatDate } from "@/lib/utils";

export async function BannerRenovacion({ tenantId, userRole }: { tenantId: string; userRole: string }) {
  if (userRole !== "admin_local" && userRole !== "admin_nucleo") return null;

  const suscripcion = await prisma.suscripcion.findUnique({
    where: { tenant_id: tenantId },
    select: { hasta: true },
  });
  const { estado, dias } = estadoContrato(suscripcion?.hasta);
  if (estado !== "por_vencer" && estado !== "vencido") return null;

  const destino = userRole === "admin_nucleo" ? "/admin/pagos" : "/suscripcion";

  return (
    <div className="bg-[#FFF8E6] border border-[#E3B341] rounded-xl px-4 py-3 flex items-start gap-3 text-sm">
      <IconCalendarEvent size={18} className="text-[#8A5A00] shrink-0 mt-0.5" aria-hidden />
      <p className="flex-1 min-w-0 text-[#5B3B00]">
        <span className="font-semibold">
          {estado === "vencido" ? "El contrato anual venció. " : `El contrato anual vence en ${dias} días. `}
        </span>
        {estado === "vencido"
          ? "Renuévalo para mantener el servicio."
          : `Fecha de término: ${formatDate(suscripcion!.hasta!)}.`}
      </p>
      <Link
        href={destino}
        className="shrink-0 text-xs font-semibold text-[#5B3B00] underline underline-offset-2 whitespace-nowrap"
      >
        {userRole === "admin_nucleo" ? "Renovar" : "Ver contrato"}
      </Link>
    </div>
  );
}
