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
        <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
          <IconCreditCard size={26} className="text-[#2F6B2A]" />
          Pagos y Cobranza
        </h1>
        <p className="text-sm text-[#5B6980] mt-1 capitalize">
          {formatPeriodo(periodo)} — registro de pagos por transferencia y estado de suscripciones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#2F6B2A]">{pagados}</p>
          <p className="text-xs text-[#5B6980]">Pagados</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#D97706]">{pendientes}</p>
          <p className="text-xs text-[#5B6980]">Por cobrar</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#0B1B33]">{formatCLP(recaudado)}</p>
          <p className="text-xs text-[#5B6980]">Recaudado este mes</p>
        </div>
      </div>

      {/* Tabla */}
      {locales.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <IconBuildingStore size={32} className="mx-auto text-[#DDE3EA] mb-3" />
          <p className="text-sm text-[#5B6980]">Sin locales registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Local</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Plan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">Mensualidad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Pago del mes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#5B6980]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EA]">
              {locales.map((local) => {
                const pago = local.pagoPeriodo;
                const pagado = pago?.estado === "pagado";
                return (
                  <tr key={local.id} className="hover:bg-[#F4F6F3] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E5F1E3] flex items-center justify-center shrink-0">
                          <IconBuildingStore size={16} className="text-[#2F6B2A]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0B1B33]">{local.nombre}</p>
                          {local.suscripcion?.estado &&
                            local.suscripcion.estado !== "activa" && (
                              <p className="text-xs text-[#B42318] capitalize">
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
                            ? "bg-[#16294A] text-white"
                            : "bg-[#E5F1E3] text-[#255620]"
                        )}
                      >
                        {local.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#0B1B33] hidden md:table-cell">
                      {formatCLP(local.montoMensual)}
                    </td>
                    <td className="px-4 py-3">
                      {pagado ? (
                        <div>
                          <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-green-100 text-green-800">
                            Pagado
                          </span>
                          <p className="text-xs text-[#5B6980] mt-1">
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
