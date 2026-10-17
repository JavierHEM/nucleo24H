import { Fragment } from "react";
import { getCaller } from "@/lib/trpc/server";
import { prisma } from "@/server/db/prisma";
import { agruparPorEmpresa, claveRut } from "@/lib/empresas";
import { formatDate } from "@/lib/utils";
import { IconBuildingStore } from "@tabler/icons-react";
import { InvitarLocalButton } from "./InvitarLocalButton";
import { AsignarAsesorButton } from "./AsignarAsesorButton";
import { AgregarSucursalButton } from "./AgregarSucursalButton";
import { VerLocalButton } from "./VerLocalButton";
import { ReenviarAccesoButton } from "./ReenviarAccesoButton";
import { ScoreCards } from "@/components/dashboard/ScoreCards";

export default async function AdminLocalesPage() {
  const caller = await getCaller();
  const [locales, asesoresDb, asignaciones] = await Promise.all([
    caller.locales.list({ limit: 100 }).catch(() => []),
    prisma.user.findMany({
      where: { rol: "asesor", activo: true },
      select: { id: true, nombre: true, email: true },
    }),
    prisma.asignacionAsesor.findMany({
      where: { activo: true },
      include: { tenant: { select: { id: true } } },
    }),
  ]);

  const asesores = asesoresDb.map((a) => ({
    id: a.id,
    nombre: a.nombre ?? a.email ?? "",
    email: a.email ?? "",
  }));

  // Mapa tenant_id → asesor_id para mostrar asesor actual
  const asesorPorTenant = asignaciones.reduce((acc, a) => {
    acc[a.tenant.id] = a.asesor_id;
    return acc;
  }, {} as Record<string, string>);

  const empresas = agruparPorEmpresa(locales);
  const sucursales = locales.length - empresas.length;
  const activos = locales.filter((l: { estado: string }) => l.estado === "activo").length;
  const suspendidos = locales.filter((l: { estado: string }) => l.estado === "suspendido").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Locales</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} ·{" "}
            {locales.length} local{locales.length !== 1 ? "es" : ""}. El local
            más antiguo de cada RUT es la casa central.
          </p>
        </div>
        <InvitarLocalButton />
      </div>

      <ScoreCards
        items={[
          { label: "Empresas", value: empresas.length, hint: "Por RUT", tone: "neutral" },
          { label: "Locales", value: locales.length, hint: "En la red", tone: "neutral" },
          { label: "Sucursales", value: sucursales, hint: "Además de la casa central", tone: "neutral" },
          {
            label: "Activos",
            value: activos,
            hint: suspendidos > 0 ? `${suspendidos} suspendido${suspendidos === 1 ? "" : "s"}` : "Sin suspensiones",
            tone: suspendidos > 0 ? "alerta" : "ok",
          },
        ]}
      />

      {/* Tabla de locales */}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">RUT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">Registros</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden lg:table-cell">Asesor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#5B6980]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EA]">
              {empresas.map((empresa) => {
                const cantidad = 1 + empresa.sucursales.length;
                const filas = [empresa.casaCentral, ...empresa.sucursales];
                return (
                  <Fragment key={claveRut(empresa.rut)}>
                    <tr className="bg-[#F1F5F9]">
                      <td colSpan={7} className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold tracking-wide text-[#0B1B33]">
                              Empresa · {empresa.rut}
                            </p>
                            <p className="text-xs text-[#5B6980]">
                              {cantidad === 1
                                ? "1 local, sin sucursales"
                                : `${cantidad} locales · ${empresa.sucursales.length} sucursal${empresa.sucursales.length === 1 ? "" : "es"}`}
                            </p>
                          </div>
                          <AgregarSucursalButton
                            casaCentralId={empresa.casaCentral.id}
                            casaCentralNombre={empresa.casaCentral.nombre}
                            rut={empresa.casaCentral.rut}
                            planActual={empresa.casaCentral.plan}
                          />
                        </div>
                      </td>
                    </tr>
                    {filas.map((local) => {
                      const esCasa = local.id === empresa.casaCentral.id;
                      return (
                        <tr key={local.id} className="hover:bg-[#F4F6F3] transition-colors">
                          <td className="px-4 py-3">
                            <div className={`flex items-center gap-3 ${esCasa ? "" : "pl-6"}`}>
                              <div className="w-8 h-8 rounded-lg bg-[#E5F1E3] flex items-center justify-center shrink-0">
                                <IconBuildingStore size={16} className="text-[#2F6B2A]" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-[#0B1B33]">{local.nombre}</p>
                                  <span className="text-[10px] font-medium uppercase tracking-wide text-[#16294A] border border-[#DDE3EA] rounded px-1.5 py-0.5">
                                    {esCasa ? "Casa central" : "Sucursal"}
                                  </span>
                                </div>
                                <p className="text-xs text-[#5B6980]">{formatDate(local.created_at)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#5B6980] hidden md:table-cell">{local.rut}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs rounded-full px-2 py-0.5 font-medium capitalize ${
                                local.plan === "integral"
                                  ? "bg-[#16294A] text-white"
                                  : "bg-[#E5F1E3] text-[#255620]"
                              }`}
                            >
                              {local.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                                local.estado === "activo"
                                  ? "bg-green-100 text-green-800"
                                  : local.estado === "suspendido"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {local.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-[#5B6980] hidden md:table-cell">
                            {local._count.registros}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {asesorPorTenant[local.id] ? (
                              <span className="text-xs text-[#334155]">
                                {asesores.find((a) => a.id === asesorPorTenant[local.id])?.nombre ?? "—"}
                              </span>
                            ) : (
                              <span className="text-xs text-[#94A3B8] italic">Sin asesor</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {esCasa && <ReenviarAccesoButton tenantId={local.id} />}
                              <VerLocalButton tenantId={local.id} />
                              <AsignarAsesorButton
                                tenantId={local.id}
                                tenantNombre={local.nombre}
                                asesores={asesores}
                                asesorActualId={asesorPorTenant[local.id] ?? null}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
