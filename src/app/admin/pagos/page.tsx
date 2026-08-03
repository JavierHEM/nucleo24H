import { IconCreditCard, IconBuildingStore } from "@tabler/icons-react";
import { getCaller } from "@/lib/trpc/server";
import { formatCLP, formatDate, formatPeriodo, getCurrentPeriodo, cn } from "@/lib/utils";
import { RegistrarPagoButton } from "./RegistrarPagoButton";
import { ConfigurarSuscripcionButton } from "./ConfigurarSuscripcionButton";

export default async function AdminPagosPage() {
  const periodo = getCurrentPeriodo();
  const caller = await getCaller();
  const locales = await caller.pagos.adminResumen({ periodo }).catch(() => []);

  const pagados = locales.filter((l) => l.pagoPeriodo?.estado === "pagado").length;
  const pendientes = locales.length - pagados;
  const recaudado = locales
    .filter((l) => l.pagoPeriodo?.estado === "pagado")
    .reduce((sum, l) => sum + (l.pagoPeriodo?.monto_clp ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545] flex items-center gap-2">
          <IconCreditCard size={26} className="text-[#4B8B2E]" />
          Pagos y Cobranza
        </h1>
        <p className="text-sm text-[#64748B] mt-1 capitalize">
          {formatPeriodo(periodo)} — registro de pagos por transferencia y estado de suscripciones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#16A34A]">{pagados}</p>
          <p className="text-xs text-[#64748B]">Pagados</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#D97706]">{pendientes}</p>
          <p className="text-xs text-[#64748B]">Por cobrar</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#0B2545]">{formatCLP(recaudado)}</p>
          <p className="text-xs text-[#64748B]">Recaudado este mes</p>
        </div>
      </div>

      {/* Tabla */}
      {locales.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
          <IconBuildingStore size={32} className="mx-auto text-[#E2E8F0] mb-3" />
          <p className="text-sm text-[#64748B]">Sin locales registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F9FA] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Local</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Plan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] hidden md:table-cell">Mensualidad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Pago del mes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {locales.map((local) => {
                const pago = local.pagoPeriodo;
                const pagado = pago?.estado === "pagado";
                return (
                  <tr key={local.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EBF5E6] flex items-center justify-center shrink-0">
                          <IconBuildingStore size={16} className="text-[#4B8B2E]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0B2545]">{local.nombre}</p>
                          {local.suscripcion?.estado &&
                            local.suscripcion.estado !== "activa" && (
                              <p className="text-xs text-[#DC2626] capitalize">
                                Suscripción {local.suscripcion.estado}
                              </p>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs rounded-full px-2 py-0.5 font-medium capitalize",
                          local.plan === "integral"
                            ? "bg-[#143556] text-white"
                            : "bg-[#EBF5E6] text-[#3A6E24]"
                        )}
                      >
                        {local.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#0B2545] hidden md:table-cell">
                      {formatCLP(local.montoMensual)}
                    </td>
                    <td className="px-4 py-3">
                      {pagado ? (
                        <div>
                          <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-green-100 text-green-800">
                            Pagado
                          </span>
                          <p className="text-xs text-[#64748B] mt-1">
                            {pago.metodo === "transferencia" ? "Transferencia" : "Flow"}
                            {pago.pagado_at && ` · ${formatDate(pago.pagado_at)}`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!pagado && (
                          <RegistrarPagoButton
                            tenantId={local.id}
                            tenantNombre={local.nombre}
                            periodo={periodo}
                            montoSugerido={local.montoMensual}
                          />
                        )}
                        <ConfigurarSuscripcionButton
                          tenantId={local.id}
                          tenantNombre={local.nombre}
                          suscripcion={local.suscripcion}
                          planTenant={local.plan}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
