export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import { IconUsers, IconUser, IconShieldHalf } from "@tabler/icons-react";
import { InvitarMiembroButton } from "./InvitarMiembroButton";
import { RemoverMiembroButton } from "./RemoverMiembroButton";

const ROL_LABEL: Record<string, { label: string; className: string }> = {
  admin_local: { label: "Admin local", className: "bg-[#1A3559] text-white" },
  trabajador_local: { label: "Trabajador", className: "bg-[#EAF3E0] text-[#2D5A27]" },
  asesor: { label: "Asesor", className: "bg-purple-100 text-purple-800" },
  admin_nucleo: { label: "Admin Núcleo", className: "bg-orange-100 text-orange-800" },
};

export default async function EquipoPage() {
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
  const miembros = await caller.locales.miEquipo().catch(() => []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C] flex items-center gap-2">
            <IconUsers size={26} className="text-[#3D7A35]" />
            Mi Equipo
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Miembros con acceso a este local
          </p>
        </div>
        <InvitarMiembroButton />
      </div>

      {miembros.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EAF3E0] flex items-center justify-center mx-auto mb-3">
            <IconUsers size={24} className="text-[#3D7A35]" />
          </div>
          <p className="font-semibold text-[#0D1F3C]">Sin miembros registrados</p>
          <p className="text-sm text-[#64748B] mt-1">
            Invita a tu equipo para que puedan acceder al sistema.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F6F8] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Miembro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] hidden sm:table-cell">Desde</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {miembros.map((miembro) => {
                const rolInfo = ROL_LABEL[miembro.rol] ?? { label: miembro.rol, className: "bg-gray-100 text-gray-600" };
                const esAdmin = miembro.rol === "admin_local" || miembro.rol === "admin_nucleo";

                return (
                  <tr key={miembro.id} className="hover:bg-[#F5F6F8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${esAdmin ? "bg-[#1A3559]" : "bg-[#3D7A35]"}`}>
                          {(miembro.nombre ?? miembro.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#0D1F3C] truncate">
                            {miembro.nombre ?? "(sin nombre)"}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">{miembro.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${rolInfo.className}`}>
                        {esAdmin && <IconShieldHalf size={11} />}
                        {!esAdmin && <IconUser size={11} />}
                        {rolInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">
                      {formatDate(miembro.created_at)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${miembro.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {miembro.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RemoverMiembroButton
                        userId={miembro.id}
                        nombre={miembro.nombre ?? miembro.email ?? ""}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-[#F5F6F8] rounded-xl border border-[#E2E8F0] p-4 text-xs text-[#64748B]">
        <p className="font-medium text-[#0D1F3C] mb-1">Permisos por rol</p>
        <ul className="space-y-1">
          <li><span className="font-medium">Trabajador:</span> Registros BPM, tareas diarias y capacitaciones.</li>
          <li><span className="font-medium">Admin local:</span> Todo lo anterior + documentos, sellos, visitas, comunicaciones y gestión del equipo.</li>
        </ul>
      </div>
    </div>
  );
}
