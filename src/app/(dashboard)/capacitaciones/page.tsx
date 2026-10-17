import { getCaller } from "@/lib/trpc/server";
import { formatDate, getCurrentPeriodo } from "@/lib/utils";
import { IconSchool, IconCircleCheck, IconClock } from "@tabler/icons-react";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
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
  const asistentesMes = registrosMes.reduce((suma, registro) => {
    const datos = registro.datos as { asistentes?: number | unknown[] } | null;
    const valor = datos?.asistentes;
    if (typeof valor === "number") return suma + valor;
    if (Array.isArray(valor)) return suma + valor.length;
    return suma;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Capacitaciones</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Registro de asistencia y capacitaciones BPM
          </p>
        </div>
        <NuevaCapacitacionButton />
      </div>

      <ScoreCards
        items={[
          { label: "Este mes", value: registrosMes.length, hint: "Capacitaciones", tone: registrosMes.length > 0 ? "ok" : "alerta" },
          { label: "Asistentes", value: asistentesMes, hint: "En el mes", tone: "neutral" },
          { label: "Historial", value: registrosResult.length, hint: "Registradas", tone: "neutral" },
          { label: "Cobertura", value: registrosMes.length > 0 ? "Al día" : "Falta", hint: "Del período", tone: registrosMes.length > 0 ? "ok" : "alerta" },
        ]}
      />

      {/* Lista */}
      {registrosResult.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#E5F1E3] flex items-center justify-center mx-auto mb-3">
            <IconSchool size={24} className="text-[#2F6B2A]" />
          </div>
          <p className="font-semibold text-[#0B1B33]">Sin capacitaciones registradas</p>
          <p className="text-sm text-[#5B6980] mt-1">
            Registra la asistencia del equipo a cada capacitación.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm divide-y divide-[#DDE3EA]">
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
                asistentes?: number | Array<unknown>;
                instructor?: string;
                relator?: string;
              };
              const cantidad = Array.isArray(datos.asistentes) ? datos.asistentes.length : datos.asistentes;
              const relator = datos.relator ?? datos.instructor;
              return (
                <div key={r.id} className="flex items-center gap-4 p-4">
                  <div className="w-9 h-9 rounded-lg bg-[#E5F1E3] flex items-center justify-center shrink-0">
                    <IconSchool size={18} className="text-[#2F6B2A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1B33] truncate">
                      {datos.tema ?? "Capacitación BPM"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[#5B6980] flex items-center gap-1">
                        <IconClock size={11} />
                        {formatDate(r.fecha)}
                      </span>
                      {cantidad ? (
                        <span className="text-xs text-[#5B6980]">
                          {cantidad} asistente{cantidad > 1 ? "s" : ""}
                        </span>
                      ) : null}
                      {relator && (
                        <span className="text-xs text-[#5B6980]">
                          {relator}
                        </span>
                      )}
                    </div>
                  </div>
                  <IconCircleCheck size={18} className="text-[#2F6B2A] shrink-0" />
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
