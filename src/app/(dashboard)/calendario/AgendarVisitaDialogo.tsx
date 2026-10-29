"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TIPOS_VISITA } from "@/lib/bpm/visita";

const hoy = () => new Date().toISOString().slice(0, 10);

export function AgendarVisitaDialogo({
  abierto,
  tenantId,
  onCerrar,
}: {
  abierto: boolean;
  tenantId: string;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<(typeof TIPOS_VISITA)[number]>("programada");
  const [fecha, setFecha] = useState(hoy);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const agendar = trpc.visitas.agendar.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.calendario.eventos.invalidate(), utils.plan.resumen.invalidate()]);
      setTipo("programada");
      setFecha(hoy());
      onCerrar();
    },
  });

  return (
    <Dialogo abierto={abierto} titulo="Agendar visita" onCerrar={onCerrar}>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          if (!fecha) {
            setErrorLocal("Selecciona la fecha de la visita.");
            return;
          }
          setErrorLocal(null);
          agendar.mutate({ tenant_id: tenantId, tipo, fecha: new Date(`${fecha}T12:00:00`).toISOString() });
        }}
        className="space-y-4"
      >
        <fieldset>
          <legend className="text-sm font-medium text-[#0B1B33]">Tipo de visita</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {TIPOS_VISITA.map((opcion) => (
              <button
                key={opcion}
                type="button"
                aria-pressed={tipo === opcion}
                onClick={() => setTipo(opcion)}
                className={`min-h-11 rounded-xl border text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
                  tipo === opcion
                    ? "border-[#16294A] bg-[#16294A] text-white"
                    : "border-[#DDE3EA] bg-white text-[#334155]"
                }`}
              >
                {opcion === "programada" ? "Programada" : "Sorpresa"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#5B6980]">
            {tipo === "sorpresa"
              ? "El local no verá esta visita en su calendario hasta que ocurra."
              : "El local verá esta visita en su calendario."}
          </p>
        </fieldset>

        <div>
          <Label htmlFor="agenda-fecha">Fecha</Label>
          <Input
            id="agenda-fecha"
            type="date"
            min={hoy()}
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            className="mt-1 min-h-11"
            required
          />
        </div>

        {(errorLocal || agendar.error) && (
          <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">{errorLocal ?? agendar.error?.message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={agendar.isPending} className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white">
            {agendar.isPending ? "Agendando…" : "Agendar"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
