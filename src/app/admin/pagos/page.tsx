import { IconCreditCard, IconBuildingStore } from "@tabler/icons-react";
import { getCaller } from "@/lib/trpc/server";
import { formatCLP, formatDate, formatPeriodo, getCurrentPeriodo, cn } from "@/lib/utils";
import { RegistrarPagoButton } from "./RegistrarPagoButton";
import { PagarPruebaMpButton } from "./PagarPruebaMpButton";
import { pruebaMpNucleoActiva } from "@/lib/payments/pruebaNucleo";
import { ConfigurarSuscripcionButton } from "./ConfigurarSuscripcionButton";
import { RenovarContratoButton } from "./RenovarContratoButton";
import { ALZA_TARIFA_DESDE, estadoContrato, precioConIva, TARIFA_NETA_DESDE_2027 } from "@/lib/planes";
import { ETIQUETA_METODO } from "@/lib/payments/metodos";
import { DIA_SOLO_LECTURA, DIAS_GRACIA_CORRIDO, etiquetaFaseCobranza, faseCobranza } from "@/lib/payments/mora";
import { debitoAutorizado, mapPreapprovalStatus } from "@/lib/payments/debito";

function etiquetaDebito(suscripcion: {
  modo_cobro: string | null;
  mp_preapproval_status: string | null;
} | null) {
  if (!suscripcion) return null;
  if (debitoAutorizado({ modoCobro: suscripcion.modo_cobro, preapprovalStatus: suscripcion.mp_preapproval_status })) {
    return "Débito automático";
  }
  if (mapPreapprovalStatus(suscripcion.mp_preapproval_status) === "pending") {
    return "Débito por autorizar";
  }
  return null;
}

export default async function AdminPagosPage() {
  const periodo = getCurrentPeriodo();
  const ahora = new Date();
  const caller = await getCaller();
  const locales = await caller.pagos.adminResumen({ periodo }).catch(() => []);

  const cobros = locales.map((local) =>
    faseCobranza({
      pagadoEstePeriodo: local.pagoPeriodo?.estado === "pagado",
      diaCobro: local.suscripcion?.dia_cobro ?? 5,
      ahora,
    })
  );
  const pagados = cobros.filter((item) => item.fase === "pagado").length;
  const enGracia = cobros.filter((item) => item.fase === "gracia").length;
  const enCorte = cobros.filter((item) => item.fase === "corte").length;
  const recaudado = locales
    .filter((l) => l.pagoPeriodo?.estado === "pagado")
    .reduce((sum, l) => sum + (l.pagoPeriodo?.monto_clp ?? 0), 0);
  const muestraAlza = ahora < ALZA_TARIFA_DESDE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
          <IconCreditCard size={26} className="text-[#2F6B2A]" />
          Pagos y Cobranza
        </h1>
        <p className="text-sm text-[#5B6980] mt-1 capitalize">
          {formatPeriodo(periodo)} — transferencia, Mercado Pago y débito automático
        </p>
        <p className="text-xs text-[#5B6980] mt-2">
          {DIAS_GRACIA_CORRIDO} días corridos de gracia tras el vencimiento. El día {DIA_SOLO_LECTURA} la cuenta
          pasa a solo lectura y el sello público se oculta.
          {muestraAlza
            ? ` Desde marzo 2027 el Plan Calidad pasa a ${formatCLP(precioConIva(TARIFA_NETA_DESDE_2027))} al mes.`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#2F6B2A]">{pagados}</p>
          <p className="text-xs text-[#5B6980]">Pagados</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${enGracia > 0 ? "text-[#D97706]" : "text-[#0B1B33]"}`}>{enGracia}</p>
          <p className="text-xs text-[#5B6980]">En gracia</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${enCorte > 0 ? "text-[#B42318]" : "text-[#0B1B33]"}`}>{enCorte}</p>
          <p className="text-xs text-[#5B6980]">Solo lectura</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#0B1B33]">{formatCLP(recaudado)}</p>
          <p className="text-xs text-[#5B6980]">Recaudado este mes</p>
        </div>
      </div>

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
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden lg:table-cell">Contrato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Pago del mes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#5B6980]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EA]">
              {locales.map((local, indice) => {
                const pago = local.pagoPeriodo;
                const pagado = pago?.estado === "pagado";
                const contrato = estadoContrato(local.suscripcion?.hasta);
                const cobro = cobros[indice];
                const etiquetaMora = etiquetaFaseCobranza(cobro.fase, cobro.dias);
                const debito = etiquetaDebito(local.suscripcion);
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
                          {debito && (
                            <p className={cn("text-xs", debito === "Débito por autorizar" ? "text-[#8A5A00]" : "text-[#255620]")}>
                              {debito}
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
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {contrato.estado === "sin_definir" ? (
                        <span className="text-xs text-[#5B6980]">Sin definir</span>
                      ) : (
                        <div>
                          <p className="text-xs text-[#0B1B33]">Hasta {formatDate(local.suscripcion!.hasta!)}</p>
                          <p
                            className={cn(
                              "text-xs",
                              contrato.estado === "vigente" ? "text-[#5B6980]" : "text-[#8A5A00] font-medium"
                            )}
                          >
                            {contrato.estado === "vencido"
                              ? "Vencido"
                              : contrato.estado === "por_vencer"
                                ? `Vence en ${contrato.dias} días`
                                : "Vigente"}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {pagado ? (
                        <div>
                          <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-green-100 text-green-800">
                            Pagado
                          </span>
                          <p className="text-xs text-[#5B6980] mt-1">
                            {ETIQUETA_METODO[pago.metodo] ?? pago.metodo}
                            {pago.pagado_at && ` · ${formatDate(pago.pagado_at)}`}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span
                            className={cn(
                              "text-xs rounded-full px-2 py-0.5 font-medium",
                              cobro.fase === "corte"
                                ? "bg-red-100 text-red-800"
                                : cobro.fase === "gracia"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-yellow-100 text-yellow-800"
                            )}
                          >
                            {cobro.fase === "corte" ? "Solo lectura" : cobro.fase === "gracia" ? "En gracia" : "Pendiente"}
                          </span>
                          {etiquetaMora && (
                            <p className="text-xs text-[#5B6980] mt-1">{etiquetaMora}</p>
                          )}
                          {local.suscripcion?.dia_cobro && cobro.fase === "vigente" && (
                            <p className="text-xs text-[#5B6980] mt-1">Cobro el día {local.suscripcion.dia_cobro}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!pagado && (
                          <>
                            {pruebaMpNucleoActiva() && (
                              <PagarPruebaMpButton tenantId={local.id} periodo={periodo} />
                            )}
                            <RegistrarPagoButton
                              tenantId={local.id}
                              tenantNombre={local.nombre}
                              periodo={periodo}
                              montoSugerido={local.montoMensual}
                            />
                          </>
                        )}
                        {local.suscripcion && (contrato.estado === "por_vencer" || contrato.estado === "vencido") && (
                          <RenovarContratoButton tenantId={local.id} tenantNombre={local.nombre} />
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
