import Link from "next/link";
import { IconAlertTriangle } from "@tabler/icons-react";
import { prisma } from "@/server/db/prisma";
import { DIA_SOLO_LECTURA, DIAS_GRACIA_CORRIDO } from "@/lib/payments/mora";

interface Props {
  tenantId: string;
  userRole: string;
}

export async function BannerMora({ tenantId, userRole }: Props) {
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { tenant_id: tenantId },
    select: { estado: true, acceso_hasta: true },
  });

  if (!suscripcion || (suscripcion.estado !== "morosa" && suscripcion.estado !== "suspendida" && suscripcion.estado !== "cancelada")) {
    return null;
  }

  const admin = userRole === "admin_local" || userRole === "admin_nucleo";

  if (suscripcion.estado === "morosa") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-sm">
        <IconAlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-amber-800">Pago pendiente. </span>
          <span className="text-amber-700">
            Tienes {DIAS_GRACIA_CORRIDO} días corridos de gracia después del vencimiento. Si el pago no está confirmado, desde el día {DIA_SOLO_LECTURA} la cuenta pasa a solo lectura y el sello público se oculta.
          </span>
        </div>
        {admin && (
          <Link href="/suscripcion" className="shrink-0 text-xs font-semibold text-amber-800 underline underline-offset-2">
            Ver pago
          </Link>
        )}
      </div>
    );
  }

  if (suscripcion.estado === "cancelada") {
    return (
      <div className="bg-[#EEF1F4] border border-[#DDE3EA] rounded-xl px-4 py-3 text-sm text-[#334155]">
        <span className="font-semibold">Suscripción cancelada. </span>
        {suscripcion.acceso_hasta
          ? `Acceso completo hasta el ${suscripcion.acceso_hasta.toLocaleDateString("es-CL")}. Después queda solo lectura y el sello público se oculta.`
          : "La cuenta está en solo lectura. El sello público no se exhibe."}
      </div>
    );
  }

  return (
    <div className="bg-[#FCE4E1] border border-[#F5C2C0] rounded-xl px-4 py-3 flex items-start gap-3 text-sm">
      <IconAlertTriangle size={18} className="text-[#9A1C12] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-[#9A1C12]">Cuenta en solo lectura. </span>
        <span className="text-[#9A1C12]">
          Puedes ver y descargar el historial. No se pueden crear registros, evidencias ni cerrar hallazgos hasta regularizar el pago. El sello público está oculto.
        </span>
      </div>
      {admin && (
        <Link href="/suscripcion" className="shrink-0 text-xs font-semibold text-[#9A1C12] underline underline-offset-2">
          Regularizar
        </Link>
      )}
    </div>
  );
}
