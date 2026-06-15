import Link from "next/link";
import { IconAlertTriangle } from "@tabler/icons-react";
import { prisma } from "@/server/db/prisma";

interface Props {
  tenantId: string;
  userRole: string;
}

/**
 * Se monta en layouts/páginas que conocen el tenant activo.
 * Retorna null si la suscripción está al día.
 */
export async function BannerMora({ tenantId, userRole }: Props) {
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { tenant_id: tenantId },
    select: { estado: true },
  });

  if (!suscripcion || suscripcion.estado !== "morosa") return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-sm">
      <IconAlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-amber-800">Suscripción con pago pendiente. </span>
        <span className="text-amber-700">
          Para evitar la suspensión del servicio, regulariza tu pago lo antes posible.
        </span>
      </div>
      {(userRole === "admin_local" || userRole === "admin_nucleo") && (
        <Link
          href="/suscripcion"
          className="shrink-0 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap"
        >
          Ver pago
        </Link>
      )}
    </div>
  );
}
