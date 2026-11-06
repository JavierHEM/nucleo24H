"use client";

import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ETIQUETA_MOTIVO_VISITA, MOTIVOS_VISITA, type MotivoVisita } from "@/lib/bpm/visita";
import { codigoHallazgo } from "@/lib/hallazgos/codigo";
import { ETIQUETA_GRAVEDAD, type GravedadHallazgo } from "@/lib/hallazgos/ciclo";

export function CampoMotivoVisita({
  motivo,
  onMotivo,
  hallazgoId,
  onHallazgoId,
  codigo,
  onCodigo,
  hallazgoFijo,
}: {
  motivo: MotivoVisita;
  onMotivo: (motivo: MotivoVisita) => void;
  hallazgoId: string;
  onHallazgoId: (id: string) => void;
  codigo: string;
  onCodigo: (codigo: string) => void;
  hallazgoFijo?: { id: string; descripcion: string } | null;
}) {
  const pideHallazgo = motivo === "hallazgo" || motivo === "seguimiento";
  const vinculables = trpc.hallazgos.vinculables.useQuery(undefined, { enabled: pideHallazgo && !hallazgoFijo });

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-[#0B1B33]">Motivo</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MOTIVOS_VISITA.map((opcion) => (
          <button
            key={opcion}
            type="button"
            aria-pressed={motivo === opcion}
            onClick={() => onMotivo(opcion)}
            className={`min-h-11 rounded-xl border px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
              motivo === opcion
                ? "border-[#16294A] bg-[#16294A] text-white"
                : "border-[#DDE3EA] bg-white text-[#334155]"
            }`}
          >
            {ETIQUETA_MOTIVO_VISITA[opcion]}
          </button>
        ))}
      </div>

      {pideHallazgo && hallazgoFijo && (
        <p className="text-sm text-[#334155] bg-[#F4F6F3] rounded-xl px-3 py-2">
          <span className="font-mono font-semibold text-[#0B1B33]">{codigoHallazgo(hallazgoFijo.id)}</span>
          {" · "}
          {hallazgoFijo.descripcion}
        </p>
      )}

      {pideHallazgo && !hallazgoFijo && (
        <div className="space-y-3 rounded-xl border border-[#DDE3EA] p-3">
          <p className="text-xs text-[#5B6980]">
            {motivo === "hallazgo"
              ? "Elige el hallazgo abierto o escribe su código (H-A8F04228)."
              : "Si esta visita hace seguimiento de un hallazgo, vincúlalo."}
          </p>
          <div>
            <Label htmlFor="visita-hallazgo">Hallazgo del local</Label>
            <select
              id="visita-hallazgo"
              value={hallazgoId}
              onChange={(evento) => {
                onHallazgoId(evento.target.value);
                onCodigo("");
              }}
              className="mt-1 w-full min-h-11 rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm"
            >
              <option value="">Elegir hallazgo…</option>
              {(vinculables.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {codigoHallazgo(item.id)} · {ETIQUETA_GRAVEDAD[item.gravedad as GravedadHallazgo] ?? item.gravedad} ·{" "}
                  {item.descripcion.length > 60 ? `${item.descripcion.slice(0, 57)}…` : item.descripcion}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="visita-codigo">O código del hallazgo</Label>
            <Input
              id="visita-codigo"
              value={codigo}
              onChange={(evento) => {
                onCodigo(evento.target.value.toUpperCase());
                onHallazgoId("");
              }}
              placeholder="H-A8F04228"
              className="mt-1 min-h-11 font-mono"
            />
          </div>
          {vinculables.data && vinculables.data.length === 0 && (
            <p className="text-xs text-[#5B6980]">Este local no tiene hallazgos abiertos para vincular.</p>
          )}
        </div>
      )}
    </fieldset>
  );
}
