import { redirect } from "next/navigation";
import {
  IconCreditCard,
  IconBuildingBank,
  IconCircleCheck,
  IconClock,
  IconX,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { getCaller } from "@/lib/trpc/server";
import { formatCLP, formatDate, formatPeriodo, getCurrentPeriodo, cn } from "@/lib/utils";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { PagarButton } from "./PagarButton";
import { estadoContrato } from "@/lib/planes";
import { ETIQUETA_METODO } from "@/lib/payments/metodos";

const PLAN_LABELS: Record<string, string> = {
  calidad: "Plan Calidad",
  integral: "Plan Integral",
};

const ESTADO_SUSCRIPCION: Record<string, { label: string; className: string }> = {
  activa: { label: "Activa", className: "bg-green-100 text-green-800" },
  morosa: { label: "Pago pendiente", className: "bg-yellow-100 text-yellow-800" },
  suspendida: { label: "Suspendida", className: "bg-red-100 text-red-800" },
  cancelada: { label: "Cancelada", className: "bg-gray-100 text-gray-600" },
};

const ESTADO_PAGO: Record<
  string,
  { label: string; className: string; icon: typeof IconCircleCheck }
> = {
  pagado: { label: "Pagado", className: "text-green-700", icon: IconCircleCheck },
  pendiente: { label: "Pendiente", className: "text-yellow-700", icon: IconClock },
  rechazado: { label: "Rechazado", className: "text-red-700", icon: IconX },
  anulado: { label: "Anulado", className: "text-gray-500", icon: IconX },
};

export default async function SuscripcionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });
  if (dbUser?.rol !== "admin_local" && dbUser?.rol !== "admin_nucleo") {
    redirect("/");
  }

  const caller = await getCaller();
  const data = await caller.pagos.getSuscripcion().catch(() => null);

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-[#DDE3EA] p-8 text-center text-sm text-[#5B6980]">
        No pudimos cargar la información de tu suscripción. Intenta de nuevo.
      </div>
    );
  }

  const periodoActual = getCurrentPeriodo();
  const pagoPeriodoActual = data.pagos.find(
    (p) => p.periodo === periodoActual && p.estado === "pagado"
  );
  const estadoSus =
    ESTADO_SUSCRIPCION[data.suscripcion?.estado ?? "activa"] ??
    ESTADO_SUSCRIPCION.activa;

  const contrato = estadoContrato(data.suscripcion?.hasta);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
          <IconCreditCard size={26} className="text-[#2F6B2A]" />
          Suscripción y Pagos
        </h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Estado de tu plan y historial de pagos
        </p>
      </div>

      <ScoreCards
        items={[
          { label: "Plan", value: PLAN_LABELS[data.plan] ?? data.plan, hint: `${formatCLP(data.montoMensual)} / mes`, tone: "neutral" },
          { label: "Estado", value: estadoSus.label, hint: "De la suscripción", tone: data.suscripcion?.estado === "activa" || !data.suscripcion ? "ok" : "alerta" },
          { label: "Este mes", value: pagoPeriodoActual ? "Pagado" : "Por pagar", hint: formatPeriodo(periodoActual), tone: pagoPeriodoActual ? "ok" : "alerta" },
          {
            label: "Pagos",
            value: data.pagos.filter((pago) => pago.estado === "pagado").length,
            hint: `de ${data.pagos.length} registrados`,
            tone: "neutral",
          },
        ]}
      />

      {/* Plan actual */}
      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#5B6980]">Tu plan</p>
            <p className="text-xl font-bold text-[#0B1B33] mt-0.5">
              {PLAN_LABELS[data.plan] ?? data.plan}
            </p>
            <p className="text-sm text-[#5B6980] mt-1">
              {formatCLP(data.montoMensual)} / mes
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              estadoSus.className
            )}
          >
            {estadoSus.label}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-[#DDE3EA] flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-[#5B6980]">Período actual: </span>
            <span className="font-medium text-[#0B1B33] capitalize">
              {formatPeriodo(periodoActual)}
            </span>
            {pagoPeriodoActual ? (
              <span className="ml-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Pagado
              </span>
            ) : (
              <span className="ml-2 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                Por pagar
              </span>
            )}
          </div>
          {!pagoPeriodoActual && (
            <PagarButton
              periodo={periodoActual}
              monto={data.montoMensual}
              disponible={data.pagosEnLineaDisponibles}
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#0B1B33]">Contrato anual</p>
        {contrato.estado === "sin_definir" ? (
          <p className="text-sm text-[#5B6980] mt-1">Casa central aún no define las fechas de tu contrato.</p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#5B6980]">Inicio</p>
              <p className="font-medium text-[#0B1B33]">{formatDate(data.suscripcion!.desde)}</p>
            </div>
            <div>
              <p className="text-xs text-[#5B6980]">Término</p>
              <p className="font-medium text-[#0B1B33]">{formatDate(data.suscripcion!.hasta!)}</p>
            </div>
          </div>
        )}
        {(contrato.estado === "por_vencer" || contrato.estado === "vencido") && (
          <p className="mt-3 text-sm text-[#5B3B00] bg-[#FFF8E6] border border-[#E3B341] rounded-lg px-3 py-2">
            {contrato.estado === "vencido"
              ? "El contrato venció. Escribe a tu asesor para renovarlo."
              : `El contrato vence en ${contrato.dias} días. Escribe a tu asesor para renovarlo.`}
          </p>
        )}
      </div>

      {/* Aviso pago por transferencia mientras Flow no esté activo */}
      {!data.pagosEnLineaDisponibles && (
        <div className="bg-[#E5F1E3] rounded-xl border border-green-200 p-4 flex items-start gap-3">
          <IconBuildingBank size={20} className="text-[#255620] shrink-0 mt-0.5" />
          <div className="text-sm text-[#255620]">
            <p className="font-semibold">Pago por transferencia bancaria</p>
            <p className="text-xs mt-1 text-[#2F6B2A]">
              El pago en línea estará disponible próximamente. Por ahora, realiza tu
              pago por transferencia y el equipo de Nucleo 24H lo registrará aquí.
            </p>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#0B1B33] mb-3">
          Historial de pagos
        </p>
        {data.pagos.length === 0 ? (
          <p className="text-sm text-[#5B6980] text-center py-6 border border-dashed border-[#DDE3EA] rounded-xl">
            Aún no hay pagos registrados.
          </p>
        ) : (
          <div className="space-y-1">
            {data.pagos.map((pago) => {
              const estado = ESTADO_PAGO[pago.estado] ?? ESTADO_PAGO.pendiente;
              const EstadoIcon = estado.icon;
              return (
                <div
                  key={pago.id}
                  className="flex items-center gap-3 py-2.5 border-b border-[#DDE3EA] last:border-0 text-sm"
                >
                  <EstadoIcon size={18} className={cn("shrink-0", estado.className)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0B1B33] capitalize">
                      {formatPeriodo(pago.periodo)}
                    </p>
                    <p className="text-xs text-[#5B6980]">
                      {ETIQUETA_METODO[pago.metodo] ?? "Pago en línea"}
                      {pago.pagado_at && ` · ${formatDate(pago.pagado_at)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-[#0B1B33]">
                      {formatCLP(pago.monto_clp)}
                    </p>
                    <p className={cn("text-xs", estado.className)}>{estado.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
