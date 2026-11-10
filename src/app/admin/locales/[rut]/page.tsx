import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconBuildingStore, IconMapPin, IconPhone } from "@tabler/icons-react";
import { getCaller } from "@/lib/trpc/server";
import { prisma } from "@/server/db/prisma";
import { etiquetaEstadoLocal } from "@/lib/locales/estado";
import { etiquetaSitioEmpresa } from "@/lib/locales/etiquetasEmpresa";
import { PLANES, TIPO_LOCAL_LABEL, contratoPorVencer, diasParaFecha, normalizarPlan, normalizarTipoLocal } from "@/lib/planes";
import { formatCLP, formatDate, getCurrentPeriodo } from "@/lib/utils";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { AgregarSucursalButton } from "../AgregarSucursalButton";
import { AsignarAsesorButton } from "../AsignarAsesorButton";
import { ReenviarAccesoButton } from "../ReenviarAccesoButton";
import { VerLocalButton } from "../VerLocalButton";
import { EditarLocalButton } from "../EditarLocalButton";
import { EditarEmpresaButton } from "../EditarEmpresaButton";
import { InvitarDueñoButton } from "../InvitarDueñoButton";
import { EstadoLocalButton } from "../EstadoLocalButton";
import { RegistrarPagoButton } from "../../pagos/RegistrarPagoButton";
import { PagarPruebaMpButton } from "../../pagos/PagarPruebaMpButton";
import { pruebaMpNucleoActiva } from "@/lib/payments/pruebaNucleo";

export default async function EmpresaLocalesPage({
  params,
}: {
  params: Promise<{ rut: string }>;
}) {
  const { rut } = await params;
  const caller = await getCaller();

  const [ficha, asesoresDb, asignaciones] = await Promise.all([
    caller.empresas.porRut({ rut }).catch(() => null),
    prisma.user.findMany({
      where: { rol: "asesor", activo: true },
      select: { id: true, nombre: true, email: true },
    }),
    prisma.asignacionAsesor.findMany({
      where: { activo: true },
      select: { tenant_id: true, asesor_id: true },
    }),
  ]);

  if (!ficha || ficha.locales.length === 0) notFound();

  const { empresa, locales: filas } = ficha;
  const casaCentral = filas[0];
  const sucursales = filas.slice(1);
  const ids = filas.map((local) => local.id);

  const dueños = await prisma.userTenant.findMany({
    where: { tenant_id: { in: ids }, user: { rol: "admin_local" } },
    select: { tenant_id: true },
  });
  const asesores = asesoresDb.map((asesor) => ({
    id: asesor.id,
    nombre: asesor.nombre ?? asesor.email ?? "",
    email: asesor.email ?? "",
  }));

  const asesorPorTenant = Object.fromEntries(asignaciones.map((a) => [a.tenant_id, a.asesor_id]));
  const tieneDueño = new Set(dueños.map((item) => item.tenant_id));
  const activos = filas.filter((local) => local.estado === "activo").length;
  const suspendidos = filas.filter((local) => local.estado === "suspendido").length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/locales"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
        >
          <IconArrowLeft size={16} />
          Todas las empresas
        </Link>
      </div>

      <section className="rounded-2xl border border-[#DDE3EA] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B6980]">Empresa</p>
            <h1 className="text-2xl font-bold text-[#0B1B33] mt-1">{empresa.razon_social}</h1>
            <p className="text-sm text-[#5B6980] mt-1">
              RUT {empresa.rut}
              {empresa.giro ? ` · ${empresa.giro}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EditarEmpresaButton empresa={empresa} />
            <AgregarSucursalButton rut={empresa.rut} />
          </div>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <dt className="text-xs font-semibold text-[#5B6980]">Representante legal</dt>
            <dd className="mt-1 text-[#334155]">
              {empresa.representante_legal_nombre || <span className="text-[#94A3B8] italic">Sin dato</span>}
              {empresa.representante_legal_rut ? (
                <span className="block text-xs text-[#5B6980] mt-0.5">RUT {empresa.representante_legal_rut}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#5B6980]">Teléfono</dt>
            <dd className="mt-1 text-[#334155]">{empresa.telefono || <span className="text-[#94A3B8] italic">Sin teléfono</span>}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#5B6980]">Email</dt>
            <dd className="mt-1 text-[#334155]">{empresa.email || <span className="text-[#94A3B8] italic">Sin email</span>}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#5B6980]">Domicilio legal</dt>
            <dd className="mt-1 text-[#334155]">
              {empresa.domicilio_legal || <span className="text-[#94A3B8] italic">Sin domicilio</span>}
            </dd>
          </div>
        </dl>
        {empresa.notas_internas ? (
          <p className="mt-4 text-sm text-[#16294A] bg-[#F4F6F3] rounded-xl px-3 py-2">
            <span className="font-semibold">Notas Núcleo: </span>
            {empresa.notas_internas}
          </p>
        ) : null}
      </section>

      <ScoreCards
        items={[
          { label: "Locales", value: filas.length, hint: "De esta empresa", tone: "neutral" },
          {
            label: "Sucursales",
            value: sucursales.length,
            hint: sucursales.length === 0 ? "Este local es la casa matriz" : "Cada sucursal paga su plan",
            tone: "neutral",
          },
          {
            label: "Activos",
            value: activos,
            hint: suspendidos > 0 ? `${suspendidos} suspendido${suspendidos === 1 ? "" : "s"}` : "Operando",
            tone: activos === filas.length ? "ok" : "alerta",
          },
        ]}
      />

      <ul className="grid gap-3">
        {filas.map((local) => {
          const esCasa = local.id === casaCentral.id;
          const tieneSucursales = sucursales.length > 0;
          const estado = etiquetaEstadoLocal(local.estado);
          const asesorId = asesorPorTenant[local.id];
          const asesor = asesores.find((item) => item.id === asesorId);

          return (
            <li key={local.id} className="rounded-xl border border-[#DDE3EA] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F1E3] text-[#2F6B2A]">
                    <IconBuildingStore size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold text-[#0B1B33]">{local.nombre}</h2>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#16294A] border border-[#DDE3EA] rounded px-1.5 py-0.5">
                        {etiquetaSitioEmpresa({ tieneSucursales, esCasaMatriz: esCasa })}
                      </span>
                      <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${estado.className}`}>
                        {estado.label}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-[#5B6980]">
                      <IconMapPin size={14} />
                      {local.direccion || "Sin dirección"}
                      {local.ciudad ? ` · ${local.ciudad}` : ""}
                    </p>
                    {local.telefono ? (
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-[#5B6980]">
                        <IconPhone size={14} />
                        {local.telefono}
                      </p>
                    ) : null}
                  </div>
                </div>
                <EstadoLocalButton tenantId={local.id} nombre={local.nombre} estado={local.estado} />
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-[#5B6980]">Plan</dt>
                  <dd className="mt-1">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        local.plan === "integral" ? "bg-[#16294A] text-white" : "bg-[#E5F1E3] text-[#255620]"
                      }`}
                    >
                      {PLANES[normalizarPlan(local.plan)].nombre}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#5B6980]">Rubro</dt>
                  <dd className="mt-1 text-[#334155]">{TIPO_LOCAL_LABEL[normalizarTipoLocal(local.tipo_local)]}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#5B6980]">Encargado</dt>
                  <dd className="mt-1 text-[#334155]">
                    {local.encargado_nombre || <span className="text-[#94A3B8] italic">Sin encargado</span>}
                    {local.encargado_telefono ? (
                      <span className="block text-xs text-[#5B6980] mt-0.5">{local.encargado_telefono}</span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#5B6980]">Asesor</dt>
                  <dd className="mt-1 text-[#334155]">{asesor?.nombre ?? <span className="text-[#94A3B8] italic">Sin asesor</span>}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#5B6980]">Contrato</dt>
                  <dd className="mt-1 text-[#334155]">
                    {local.suscripcion ? (
                      <>
                        {local.suscripcion.monto_clp ? `${formatCLP(local.suscripcion.monto_clp)} / mes` : "Suscripción propia"}
                        {local.suscripcion.hasta && (
                          <span className="block text-xs text-[#5B6980] mt-0.5">Hasta {formatDate(local.suscripcion.hasta)}</span>
                        )}
                        {local.suscripcion.hasta && contratoPorVencer(local.suscripcion.hasta) && (
                          <span className="block text-[11px] font-medium text-[#B45309]">
                            {diasParaFecha(local.suscripcion.hasta) < 0
                              ? "Vencido"
                              : `Vence en ${diasParaFecha(local.suscripcion.hasta)} días`}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[#94A3B8] italic">Sin suscripción</span>
                    )}
                  </dd>
                </div>
              </dl>

              {local.estado === "pendiente" && (
                <p className="mt-3 text-sm text-[#16294A] bg-[#E8EEF5] rounded-xl px-3 py-2">
                  El local está creado. Se habilita cuando registres el pago de la suscripción.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-[#F1F5F9]">
                <EditarLocalButton
                  tenantId={local.id}
                  nombre={local.nombre}
                  direccion={local.direccion}
                  ciudad={local.ciudad}
                  telefono={local.telefono}
                  tipoLocal={local.tipo_local}
                  encargadoNombre={local.encargado_nombre}
                  encargadoTelefono={local.encargado_telefono}
                />
                {local.estado === "pendiente" && (
                  <>
                    {pruebaMpNucleoActiva() && (
                      <PagarPruebaMpButton tenantId={local.id} periodo={getCurrentPeriodo()} />
                    )}
                    <RegistrarPagoButton
                      tenantId={local.id}
                      tenantNombre={local.nombre}
                      periodo={getCurrentPeriodo()}
                      montoSugerido={local.suscripcion?.monto_clp ?? PLANES[normalizarPlan(local.plan)].precio}
                    />
                  </>
                )}
                {esCasa && local.estado !== "baja" && !tieneDueño.has(local.id) && (
                  <InvitarDueñoButton tenantId={local.id} />
                )}
                {esCasa && local.estado !== "baja" && tieneDueño.has(local.id) && (
                  <ReenviarAccesoButton tenantId={local.id} />
                )}
                {(local.estado === "activo" || local.estado === "suspendido") && <VerLocalButton tenantId={local.id} />}
                <AsignarAsesorButton
                  tenantId={local.id}
                  tenantNombre={local.nombre}
                  asesores={asesores}
                  asesorActualId={asesorId ?? null}
                />
                <p className="ml-auto text-xs text-[#94A3B8]">
                  {local._count.registros} registro{local._count.registros === 1 ? "" : "s"} · desde {formatDate(local.created_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
