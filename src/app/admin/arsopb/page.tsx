import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import { IconShield, IconClock, IconCircleCheck, IconAlertTriangle } from "@tabler/icons-react";
import { ResolverButton } from "./ResolverButton";

const TIPO_LABEL: Record<string, string> = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  supresion: "Supresión",
  oposicion: "Oposición",
  portabilidad: "Portabilidad",
  bloqueo: "Bloqueo",
};

export default async function AdminArsopbPage() {
  const caller = await getCaller();

  const [pendientes, proximasVencer] = await Promise.allSettled([
    caller.arsopb.panelAdmin({ estado: "pendiente" }),
    caller.arsopb.panelAdmin({ proximas_a_vencer: true }),
  ]);

  const solicitudes = pendientes.status === "fulfilled" ? pendientes.value : [];
  const urgentes = proximasVencer.status === "fulfilled" ? proximasVencer.value : [];

  const hoy = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Panel ARSOPB</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Gestión de derechos de titulares — Ley 21.719
        </p>
      </div>

      {/* Alertas urgentes */}
      {urgentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <IconAlertTriangle size={18} className="text-[#B42318] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#B42318]">
              {urgentes.length} solicitud{urgentes.length > 1 ? "es" : ""} próxima{urgentes.length > 1 ? "s" : ""} a vencer (48h)
            </p>
            <p className="text-xs text-[#B42318]/80 mt-1">
              El incumplimiento del plazo de 30 días puede constituir infracción a la Ley 21.719.
            </p>
          </div>
        </div>
      )}

      {/* Solicitudes pendientes */}
      <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EA]">
          <div className="flex items-center gap-2">
            <IconShield size={18} className="text-[#2F6B2A]" />
            <p className="text-sm font-semibold text-[#0B1B33]">Solicitudes pendientes</p>
          </div>
          <span className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 font-medium">
            {solicitudes.length}
          </span>
        </div>

        {solicitudes.length === 0 ? (
          <div className="p-8 text-center text-[#5B6980] text-sm flex items-center justify-center gap-2">
            <IconCircleCheck size={18} className="text-[#2F6B2A]" />
            Sin solicitudes pendientes
          </div>
        ) : (
          <div className="divide-y divide-[#DDE3EA]">
            {solicitudes.map(
              (s: {
                id: string;
                tipo_derecho: string;
                estado: string;
                fecha_ingreso: Date;
                fecha_limite: Date;
                titular_id: string;
                tenant?: { nombre: string };
              }) => {
                const diasRestantes = Math.ceil(
                  (new Date(s.fecha_limite).getTime() - hoy.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isUrgente = diasRestantes <= 5;

                return (
                  <div key={s.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#0B1B33]">
                            {TIPO_LABEL[s.tipo_derecho] ?? s.tipo_derecho}
                          </span>
                          {s.tenant && (
                            <span className="text-xs text-[#5B6980]">
                              · {s.tenant.nombre}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#5B6980]">
                          <span className="flex items-center gap-1">
                            <IconClock size={12} />
                            Ingreso: {formatDate(s.fecha_ingreso)}
                          </span>
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              isUrgente ? "text-[#B42318]" : "text-[#D97706]"
                            }`}
                          >
                            Vence: {formatDate(s.fecha_limite)}
                            {isUrgente && ` (${diasRestantes}d)`}
                          </span>
                        </div>
                      </div>
                      <ResolverButton
                        id={s.id}
                        tipoDerecho={s.tipo_derecho}
                        tenantNombre={s.tenant?.nombre}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
