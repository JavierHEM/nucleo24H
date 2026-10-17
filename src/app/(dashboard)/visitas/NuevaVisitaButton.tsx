"use client";

import { useState, type FormEvent } from "react";
import { IconLoader2, IconPlus, IconX } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ETIQUETA_RESULTADO,
  GRUPOS_PAUTA,
  PAUTA_VISITA,
  puntosDe,
  validarEvaluacion,
  type ItemEvaluacion,
  type ResultadoPauta,
  type TipoVisita,
} from "@/lib/bpm/visita";

const OPCIONES: ResultadoPauta[] = ["cumple", "observacion", "no_cumple"];

type Fila = {
  resultado: ResultadoPauta | "";
  nota: string;
  fecha_limite: string;
};

function hoy() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function filasVacias(): Record<string, Fila> {
  return Object.fromEntries(
    PAUTA_VISITA.map((punto) => [punto.id, { resultado: "", nota: "", fecha_limite: "" }])
  );
}

function aEvaluacion(filas: Record<string, Fila>): ItemEvaluacion[] {
  return PAUTA_VISITA.map((punto) => {
    const fila = filas[punto.id];
    const resultado: ResultadoPauta = fila.resultado || "no_revisada";
    const marcada = resultado === "observacion" || resultado === "no_cumple";
    return {
      area: punto.id,
      resultado,
      nota: marcada ? fila.nota.trim() : undefined,
      fecha_limite: marcada && fila.fecha_limite ? fila.fecha_limite : undefined,
    };
  });
}

const ESTILO_OPCION: Record<ResultadoPauta, string> = {
  cumple: "border-[#2F6B2A] bg-[#E5F1E3] text-[#255620]",
  observacion: "border-[#D97706] bg-[#FEF3C7] text-[#92400E]",
  no_cumple: "border-[#B42318] bg-red-50 text-[#991B1B]",
  no_revisada: "border-[#DDE3EA] bg-white text-[#334155]",
};

export function NuevaVisitaButton({ tenantId }: { tenantId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoVisita>("programada");
  const [fecha, setFecha] = useState(hoy);
  const [hallazgos, setHallazgos] = useState("");
  const [filas, setFilas] = useState(filasVacias);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const registrar = trpc.visitas.registrar.useMutation({
    onSuccess: async () => {
      await utils.visitas.list.invalidate();
      cerrar();
    },
  });

  function cerrar() {
    setAbierto(false);
    setTipo("programada");
    setFecha(hoy());
    setHallazgos("");
    setFilas(filasVacias());
    setErrorLocal(null);
    registrar.reset();
  }

  function marcar(id: string, resultado: ResultadoPauta) {
    setFilas((prev) => ({
      ...prev,
      [id]: { ...prev[id], resultado: prev[id].resultado === resultado ? "" : resultado },
    }));
  }

  function editar(id: string, cambio: Partial<Fila>) {
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], ...cambio } }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const evaluacion = aEvaluacion(filas);
    const error = validarEvaluacion(tipo, evaluacion);
    if (error || !fecha) {
      setErrorLocal(error ?? "Selecciona la fecha de la visita.");
      return;
    }
    setErrorLocal(null);
    await registrar.mutateAsync({
      tenant_id: tenantId,
      tipo,
      fecha: new Date(`${fecha}T12:00:00`).toISOString(),
      hallazgos: hallazgos.trim() || undefined,
      evaluacion,
    });
  }

  const pendientes = PAUTA_VISITA.filter((punto) => !filas[punto.id]?.resultado).length;

  return (
    <>
      <Button
        onClick={() => setAbierto(true)}
        className="bg-[#16294A] hover:bg-[#0B1B33] text-white gap-2"
        size="sm"
      >
        <IconPlus size={16} />
        Nueva visita
      </Button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#DDE3EA] sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-[#0B1B33]">Registrar visita</p>
                <p className="text-xs text-[#5B6980] mt-0.5">
                  {tipo === "programada"
                    ? "Recorre toda la pauta. Cada punto queda en cumple, observación o no cumple."
                    : "Marca solo lo que viste. Lo demás queda sin revisar y no abre una no conformidad."}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F6F3] text-[#5B6980] shrink-0"
                aria-label="Cerrar"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset>
                  <legend className="text-sm font-medium text-[#0B1B33]">Tipo de visita</legend>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {(["programada", "sorpresa"] as const).map((opcion) => (
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
                </fieldset>
                <div>
                  <Label htmlFor="fecha-visita">Fecha</Label>
                  <Input
                    id="fecha-visita"
                    type="date"
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                    className="mt-1 min-h-11"
                    required
                  />
                </div>
              </div>

              {GRUPOS_PAUTA.map((grupo) => (
                <section key={grupo.id} className="space-y-2">
                  <h2 className="font-mono text-[11px] tracking-wide text-[#5B6980]">{grupo.titulo}</h2>
                  {puntosDe(grupo.id).map((punto) => {
                    const fila = filas[punto.id];
                    const exigeDetalle =
                      fila.resultado === "observacion" || fila.resultado === "no_cumple";
                    return (
                      <div key={punto.id} className="rounded-xl border border-[#DDE3EA] p-3 space-y-2.5">
                        <div>
                          <p className="text-sm font-medium text-[#0B1B33]">{punto.nombre}</p>
                          {punto.codigo && (
                            <p className="font-mono text-[11px] text-[#5B6980]">{punto.codigo}</p>
                          )}
                          <p className="text-xs text-[#5B6980] mt-1">{punto.mirar}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {OPCIONES.map((opcion) => {
                            const activo = fila.resultado === opcion;
                            return (
                              <button
                                key={opcion}
                                type="button"
                                aria-pressed={activo}
                                onClick={() => marcar(punto.id, opcion)}
                                className={`min-h-10 rounded-lg border text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
                                  activo ? ESTILO_OPCION[opcion] : "border-[#DDE3EA] bg-white text-[#334155]"
                                }`}
                              >
                                {ETIQUETA_RESULTADO[opcion]}
                              </button>
                            );
                          })}
                        </div>
                        {exigeDetalle && (
                          <div className="space-y-2">
                            <Label htmlFor={`nota-${punto.id}`} className="text-xs">
                              {fila.resultado === "no_cumple"
                                ? "Qué no cumple"
                                : "Qué observaste"}
                            </Label>
                            <textarea
                              id={`nota-${punto.id}`}
                              rows={2}
                              value={fila.nota}
                              onChange={(event) => editar(punto.id, { nota: event.target.value })}
                              className="flex w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] resize-none"
                            />
                            <div>
                              <Label htmlFor={`limite-${punto.id}`} className="text-xs">
                                Fecha límite{fila.resultado === "observacion" ? " (opcional)" : ""}
                              </Label>
                              <Input
                                id={`limite-${punto.id}`}
                                type="date"
                                value={fila.fecha_limite}
                                onChange={(event) =>
                                  editar(punto.id, { fecha_limite: event.target.value })
                                }
                                className="mt-1 min-h-10"
                                required={fila.resultado === "no_cumple"}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}

              <div>
                <Label htmlFor="hallazgos">Nota de cierre (opcional)</Label>
                <textarea
                  id="hallazgos"
                  rows={2}
                  value={hallazgos}
                  onChange={(event) => setHallazgos(event.target.value)}
                  placeholder="Algo que no quedó en un punto de la pauta."
                  className="mt-1 flex w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] resize-none"
                />
              </div>

              {(errorLocal || registrar.error) && (
                <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                  {errorLocal ?? registrar.error?.message}
                </p>
              )}

              <div className="sticky bottom-0 bg-white pt-2 pb-1">
                <p className="text-xs text-[#5B6980] mb-2">
                  {tipo === "programada"
                    ? pendientes === 0
                      ? "Pauta completa."
                      : `Faltan ${pendientes} punto${pendientes === 1 ? "" : "s"}.`
                    : "Los puntos sin marcar quedan fuera de esta visita."}
                </p>
                <Button
                  type="submit"
                  disabled={registrar.isPending}
                  className="w-full min-h-12 bg-[#16294A] hover:bg-[#0B1B33] text-white gap-2"
                >
                  {registrar.isPending ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" /> Guardando...
                    </>
                  ) : (
                    "Registrar visita"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
