export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import { IconUsers, IconUser, IconShieldHalf } from "@tabler/icons-react";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { InvitarMiembroButton } from "./InvitarMiembroButton";
import { RemoverMiembroButton } from "./RemoverMiembroButton";
import { puedeAsignarCargos, puedeGestionarEquipo, puedeRemoverMiembro } from "@/lib/roles";

const ROL_LABEL: Record<string, { label: string; className: string }> = {
  admin_local: { label: "Admin local", className: "bg-[#16294A] text-white" },
  jefe_local: { label: "Jefe de local", className: "bg-[#16294A]/10 text-[#16294A]" },
  trabajador_local: { label: "Trabajador", className: "bg-[#E5F1E3] text-[#255620]" },
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

  if (!puedeGestionarEquipo(dbUser?.rol)) {
    redirect("/");
  }

  const caller = await getCaller();
  const miembros = await caller.locales.miEquipo().catch(() => []);
  const activos = miembros.filter((miembro) => miembro.activo).length;
  const jefes = miembros.filter((miembro) => miembro.rol === "admin_local" || miembro.rol === "jefe_local").length;
  const operarios = miembros.filter((miembro) => miembro.rol === "trabajador_local").length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconUsers size={26} className="text-[#2F6B2A]" />
            Mi Equipo
          </h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Miembros con acceso a este local
          </p>
        </div>
        <InvitarMiembroButton puedeAsignarCargos={puedeAsignarCargos(dbUser?.rol)} />
      </div>

      <ScoreCards
        items={[
          { label: "Personas", value: miembros.length, hint: "En el local", tone: "neutral" },
          { label: "Dueños y jefes", value: jefes, hint: "Pueden operar", tone: "neutral" },
          { label: "Operarios", value: operarios, hint: "En el turno", tone: "neutral" },
          { label: "Activos", value: activos, hint: "Con acceso", tone: miembros.length > 0 && activos === miembros.length ? "ok" : "alerta" },
        ]}
      />

      {miembros.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#E5F1E3] flex items-center justify-center mx-auto mb-3">
            <IconUsers size={24} className="text-[#2F6B2A]" />
          </div>
          <p className="font-semibold text-[#0B1B33]">Sin miembros registrados</p>
          <p className="text-sm text-[#5B6980] mt-1">
            Invita a tu equipo para que puedan acceder al sistema.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Miembro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden sm:table-cell">Desde</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EA]">
              {miembros.map((miembro) => {
                const rolInfo = ROL_LABEL[miembro.rol] ?? { label: miembro.rol, className: "bg-gray-100 text-gray-600" };
                const esAdmin = miembro.rol === "admin_local" || miembro.rol === "admin_nucleo" || miembro.rol === "jefe_local";

                return (
                  <tr key={miembro.id} className="hover:bg-[#F4F6F3] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${esAdmin ? "bg-[#16294A]" : "bg-[#2F6B2A]"}`}>
                          {(miembro.nombre ?? miembro.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#0B1B33] truncate">
                            {miembro.nombre ?? "(sin nombre)"}
                          </p>
                          <p className="text-xs text-[#5B6980] truncate">{miembro.email}</p>
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
                    <td className="px-4 py-3 text-[#5B6980] hidden sm:table-cell">
                      {formatDate(miembro.created_at)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${miembro.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {miembro.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {puedeRemoverMiembro(dbUser?.rol, miembro.rol, miembro.id, user.id) && (
                        <RemoverMiembroButton
                          userId={miembro.id}
                          nombre={miembro.nombre ?? miembro.email ?? ""}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-[#F4F6F3] rounded-xl border border-[#DDE3EA] p-4 text-xs text-[#5B6980]">
        <p className="font-medium text-[#0B1B33] mb-1">Permisos por rol</p>
        <ul className="space-y-1">
          <li><span className="font-medium">Trabajador:</span> Registros BPM, tareas diarias y capacitaciones.</li>
          <li><span className="font-medium">Jefe de local:</span> Opera el local, sube documentos y gestiona al equipo. Puede tener más de un local a cargo.</li>
          <li><span className="font-medium">Admin local:</span> Todo lo anterior, más la suscripción del local.</li>
        </ul>
      </div>
    </div>
  );
}
