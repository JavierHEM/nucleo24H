import { prisma } from "@/server/db/prisma";
import { IconUserCheck, IconBuildingStore } from "@tabler/icons-react";
import { InvitarAsesorButton } from "./InvitarAsesorButton";

export default async function AdminAsesoresPage() {
  const asesores = await prisma.user.findMany({
    where: { rol: "asesor", activo: true },
    include: {
      // Locales asignados a cada asesor
    },
    orderBy: { nombre: "asc" },
  });

  const asignaciones = await prisma.asignacionAsesor.findMany({
    where: { activo: true },
    include: {
      tenant: { select: { id: true, nombre: true, estado: true } },
    },
  });

  const asignacionesPorAsesor = asignaciones.reduce(
    (acc, a) => {
      if (!acc[a.asesor_id]) acc[a.asesor_id] = [];
      acc[a.asesor_id].push(a.tenant);
      return acc;
    },
    {} as Record<string, { id: string; nombre: string; estado: string }[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Asesores</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Profesionales Nucleo 24H y sus locales asignados
          </p>
        </div>
        <InvitarAsesorButton />
      </div>

      {asesores.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
          <IconUserCheck size={32} className="mx-auto text-[#E2E8F0] mb-3" />
          <p className="text-sm text-[#64748B]">Sin asesores registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {asesores.map((asesor) => {
            const localesAsignados = asignacionesPorAsesor[asesor.id] ?? [];
            return (
              <div
                key={asesor.id}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A3559] flex items-center justify-center text-white font-bold">
                      {(asesor.nombre ?? asesor.email ?? "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0D1F3C]">{asesor.nombre ?? asesor.email}</p>
                      <p className="text-xs text-[#64748B]">{asesor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0D1F3C]">{localesAsignados.length}</p>
                    <p className="text-xs text-[#64748B]">locales</p>
                  </div>
                </div>

                {localesAsignados.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {localesAsignados.map((local) => (
                      <span
                        key={local.id}
                        className="flex items-center gap-1 text-xs bg-[#EAF3E0] text-[#2D5A27] rounded-full px-3 py-1"
                      >
                        <IconBuildingStore size={12} />
                        {local.nombre}
                      </span>
                    ))}
                  </div>
                )}

                {localesAsignados.length === 0 && (
                  <p className="text-xs text-[#64748B]">Sin locales asignados</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
