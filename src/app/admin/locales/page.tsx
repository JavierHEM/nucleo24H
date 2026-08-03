import { getCaller } from "@/lib/trpc/server";
import { prisma } from "@/server/db/prisma";
import { formatDate } from "@/lib/utils";
import { IconBuildingStore } from "@tabler/icons-react";
import { InvitarLocalButton } from "./InvitarLocalButton";
import { AsignarAsesorButton } from "./AsignarAsesorButton";
import { AgregarSucursalButton } from "./AgregarSucursalButton";
import { VerLocalButton } from "./VerLocalButton";

export default async function AdminLocalesPage() {
  const caller = await getCaller();
  const [locales, asesoresDb, asignaciones] = await Promise.all([
    caller.locales.list({ limit: 50 }).catch(() => []),
    prisma.user.findMany({
      where: { rol: "asesor" },
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

  const activos = locales.filter((l: { estado: string }) => l.estado === "activo").length;
  const suspendidos = locales.filter((l: { estado: string }) => l.estado === "suspendido").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">Locales</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Gestión de todos los locales suscritos a Nucleo 24H
          </p>
        </div>
        <InvitarLocalButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#0B2545]">{locales.length}</p>
          <p className="text-xs text-[#64748B]">Total locales</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#16A34A]">{activos}</p>
          <p className="text-xs text-[#64748B]">Activos</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#D97706]">{suspendidos}</p>
          <p className="text-xs text-[#64748B]">Suspendidos</p>
        </div>
      </div>

      {/* Tabla de locales */}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] hidden md:table-cell">RUT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] hidden md:table-cell">Registros</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] hidden lg:table-cell">Asesor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {locales.map(
                (local: {
                  id: string;
                  nombre: string;
                  rut: string;
                  plan: string;
                  estado: string;
                  created_at: Date;
                  _count: { registros: number; sellos: number };
                }) => (
                  <tr key={local.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EBF5E6] flex items-center justify-center shrink-0">
                          <IconBuildingStore size={16} className="text-[#4B8B2E]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0B2545]">{local.nombre}</p>
                          <p className="text-xs text-[#64748B]">{formatDate(local.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden md:table-cell">{local.rut}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 font-medium capitalize ${
                          local.plan === "integral"
                            ? "bg-[#143556] text-white"
                            : "bg-[#EBF5E6] text-[#3A6E24]"
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
                    <td className="px-4 py-3 text-right text-[#64748B] hidden md:table-cell">
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
                        <VerLocalButton tenantId={local.id} />
                        <AgregarSucursalButton
                          casaCentralId={local.id}
                          casaCentralNombre={local.nombre}
                          rut={local.rut}
                          planActual={local.plan}
                        />
                        <AsignarAsesorButton
                          tenantId={local.id}
                          tenantNombre={local.nombre}
                          asesores={asesores}
                          asesorActualId={asesorPorTenant[local.id] ?? null}
                        />
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
