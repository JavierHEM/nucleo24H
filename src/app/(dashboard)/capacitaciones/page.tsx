import { getCaller } from "@/lib/trpc/server";
import { formatDate, getCurrentPeriodo } from "@/lib/utils";
import { IconSchool, IconCircleCheck, IconClock, IconCalendar } from "@tabler/icons-react";
import { NuevaCapacitacionButton } from "./NuevaCapacitacionButton";

export default async function CapacitacionesPage() {
  const caller = await getCaller();

  // Las capacitaciones se guardan como Registro con tipo='capacitacion'
  const registrosResult = await caller.registros
    .list({ tipo: "capacitacion", limit: 50 })
    .catch(() => []);

  const periodoActual = getCurrentPeriodo();
  const registrosMes = registrosResult.filter((r: { fecha: Date }) => {
    const fecha = new Date(r.fecha);
    const mes = fecha.toISOString().slice(0, 7);
    return mes === periodoActual;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Capacitaciones</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Registro de asistencia y capacitaciones BPM
          </p>
        </div>
        <NuevaCapacitacionButton />
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <IconCalendar size={16} className="text-[#3D7A35]" />
            <span className="text-xs text-[#64748B] font-medium">Este mes</span>
          </div>
          <p className="text-2xl font-bold text-[#0D1F3C]">{registrosMes.length}</p>
          <p className="text-xs text-[#64748B]">capacitaciones</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <IconSchool size={16} className="text-[#3D7A35]" />
            <span className="text-xs text-[#64748B] font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-[#0D1F3C]">{registrosResult.length}</p>
          <p className="text-xs text-[#64748B]">historial completo</p>
        </div>
      </div>

      {/* Lista */}
      {registrosResult.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EAF3E0] flex items-center justify-center mx-auto mb-3">
            <IconSchool size={24} className="text-[#3D7A35]" />
          </div>
          <p className="font-semibold text-[#0D1F3C]">Sin capacitaciones registradas</p>
          <p className="text-sm text-[#64748B] mt-1">
            Registra la asistencia del equipo a cada capacitación.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm divide-y divide-[#E2E8F0]">
          {registrosResult.map(
            (r: {
              id: string;
              fecha: Date;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              datos: any;
              estado: string;
            }) => {
              const datos = r.datos as {
                tema?: string;
                asistentes?: number;
                instructor?: string;
              };
              return (
                <div key={r.id} className="flex items-center gap-4 p-4">
                  <div className="w-9 h-9 rounded-lg bg-[#EAF3E0] flex items-center justify-center shrink-0">
                    <IconSchool size={18} className="text-[#3D7A35]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0D1F3C] truncate">
                      {datos.tema ?? "Capacitación BPM"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[#64748B] flex items-center gap-1">
                        <IconClock size={11} />
                        {formatDate(r.fecha)}
                      </span>
                      {datos.asistentes && (
                        <span className="text-xs text-[#64748B]">
                          {datos.asistentes} asistente{datos.asistentes > 1 ? "s" : ""}
                        </span>
                      )}
                      {datos.instructor && (
                        <span className="text-xs text-[#64748B]">
                          {datos.instructor}
                        </span>
                      )}
                    </div>
                  </div>
                  <IconCircleCheck size={18} className="text-[#16A34A] shrink-0" />
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
