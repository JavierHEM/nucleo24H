import type { MiembroNucleo } from "@/server/usuarios/equipoNucleo";
import { ReenviarInvitacionButton } from "./ReenviarInvitacionButton";

export function EquipoNucleoLista({
  miembros,
  usuarioActualId,
}: {
  miembros: MiembroNucleo[];
  usuarioActualId: string;
}) {
  if (miembros.length === 0) {
    return <p className="text-sm text-[#5B6980]">Todavía no hay cuentas de casa central.</p>;
  }

  return (
    <ul className="divide-y divide-[#DDE3EA] rounded-xl border border-[#DDE3EA] overflow-hidden">
      {miembros.map((miembro) => {
        const pendiente = miembro.activo && !miembro.claveDefinida;
        return (
          <li key={miembro.id} className="flex items-center gap-3 px-3 py-2.5 bg-white">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#0B1B33] truncate">
                {miembro.nombre || miembro.email}
                {miembro.id === usuarioActualId ? (
                  <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-[#5B6980]">
                    Tú
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-[#5B6980] truncate">{miembro.email}</p>
            </div>
            <span
              className={`shrink-0 text-[10px] font-medium uppercase tracking-wide rounded px-1.5 py-0.5 ${
                !miembro.activo
                  ? "bg-[#F1F5F9] text-[#5B6980]"
                  : pendiente
                    ? "bg-amber-50 text-amber-800"
                    : "bg-green-100 text-green-800"
              }`}
            >
              {!miembro.activo ? "De baja" : pendiente ? "Pendiente" : "Activo"}
            </span>
            {pendiente ? (
              <ReenviarInvitacionButton userId={miembro.id} email={miembro.email} compact />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
