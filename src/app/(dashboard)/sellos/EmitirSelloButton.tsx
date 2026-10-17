"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  IconMedal,
  IconX,
  IconSparkles,
  IconInfoCircle,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentPeriodo } from "@/lib/utils";
import { calcularSello } from "@/server/sello-engine/calcular";
import { PESOS_DEFAULT, UMBRALES_DEFAULT } from "@/server/sello-engine/tipos";
import { SELLO_CONFIG, type NivelSello } from "@/components/sellos/SelloBadge";
import { cn } from "@/lib/utils";

const schema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
  score_documentacion: z.number().min(0).max(100),
  score_condiciones: z.number().min(0).max(100),
  score_capacitaciones: z.number().min(0).max(100),
  score_tareas: z.number().min(0).max(100),
});

type FormData = z.infer<typeof schema>;

interface Props {
  tenantId: string;
}

export function EmitirSelloButton({ tenantId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { mutateAsync, isPending } = trpc.sellos.emitir.useMutation({
    onSuccess: () => {
      utils.sellos.getActual.invalidate();
      utils.sellos.getHistorial.invalidate();
      setOpen(false);
      reset();
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      periodo: getCurrentPeriodo(),
      score_documentacion: 0,
      score_condiciones: 0,
      score_capacitaciones: 0,
      score_tareas: 0,
    },
  });

  const watchedValues = watch();
  const periodoValido = /^\d{4}-\d{2}$/.test(watchedValues.periodo ?? "");
  const propuesta = trpc.sellos.propuesta.useQuery(
    { tenant_id: tenantId, periodo: watchedValues.periodo },
    { enabled: open && periodoValido }
  );
  const aplicada = useRef("");

  useEffect(() => {
    if (!open) {
      aplicada.current = "";
      return;
    }
    if (!propuesta.data || propuesta.isFetching) return;
    const clave = `${watchedValues.periodo}:${propuesta.dataUpdatedAt}`;
    if (aplicada.current === clave) return;
    aplicada.current = clave;
    setValue("score_documentacion", Math.round(propuesta.data.scores.score_documentacion));
    setValue("score_condiciones", Math.round(propuesta.data.scores.score_condiciones));
    setValue("score_capacitaciones", Math.round(propuesta.data.scores.score_capacitaciones));
    setValue("score_tareas", Math.round(propuesta.data.scores.score_tareas));
  }, [open, propuesta.data, propuesta.dataUpdatedAt, propuesta.isFetching, setValue, watchedValues.periodo]);

  const pesos = propuesta.data?.pesos ?? PESOS_DEFAULT;
  const umbrales = propuesta.data?.umbrales ?? UMBRALES_DEFAULT;

  let preview: ReturnType<typeof calcularSello> | null = null;
  try {
    preview = calcularSello({
      score_documentacion: Number(watchedValues.score_documentacion) || 0,
      score_condiciones: Number(watchedValues.score_condiciones) || 0,
      score_capacitaciones: Number(watchedValues.score_capacitaciones) || 0,
      score_tareas: Number(watchedValues.score_tareas) || 0,
      pesos,
      umbrales,
      hallazgos: propuesta.data?.hallazgos,
    });
  } catch {
    preview = null;
  }

  async function onSubmit(data: FormData) {
    await mutateAsync({
      tenant_id: tenantId,
      periodo: data.periodo,
      score_documentacion: data.score_documentacion,
      score_condiciones: data.score_condiciones,
      score_capacitaciones: data.score_capacitaciones,
      score_tareas: data.score_tareas,
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#16294A] hover:bg-[#0B1B33] text-white gap-2 shrink-0"
        size="sm"
      >
        <IconMedal size={16} />
        Emitir sello
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA] sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <IconMedal size={20} className="text-[#2F6B2A]" />
                <p className="font-semibold text-[#0B1B33]">Emitir sello mensual</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#5B6980]">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
              {/* Período */}
              <div>
                <Label htmlFor="periodo">Período</Label>
                <input
                  id="periodo"
                  type="month"
                  {...register("periodo")}
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                />
                {errors.periodo && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.periodo.message}</p>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 bg-[#E5F1E3] rounded-xl p-3 text-xs text-[#255620]">
                <IconInfoCircle size={15} className="shrink-0 mt-0.5" />
                <p>
                  Estas notas salen de los registros, documentos y tareas del mes. Ajústalas si la visita mostró algo distinto.
                </p>
              </div>

              {propuesta.data && propuesta.data.hallazgos.length > 0 && (
                <ul className="space-y-1 text-sm text-[#334155]">
                  {propuesta.data.hallazgos.map((hallazgo) => (
                    <li key={hallazgo.texto}>{hallazgo.texto}</li>
                  ))}
                </ul>
              )}

              {/* Scores */}
              <div className="space-y-4">
                {(
                  [
                    {
                      key: "score_documentacion" as const,
                      label: "Documentación",
                      peso: `${Math.round(pesos.documentacion * 100)}%`,
                      desc: "Documentos del mes aprobados y vigentes",
                    },
                    {
                      key: "score_condiciones" as const,
                      label: "Controles del programa",
                      peso: `${Math.round(pesos.condiciones * 100)}%`,
                      desc: "Lo que el local debía registrar en el turno",
                    },
                    {
                      key: "score_capacitaciones" as const,
                      label: "Capacitaciones",
                      peso: `${Math.round(pesos.capacitaciones * 100)}%`,
                      desc: "Capacitaciones registradas en el mes",
                    },
                    {
                      key: "score_tareas" as const,
                      label: "Tareas del turno",
                      peso: `${Math.round(pesos.tareas * 100)}%`,
                      desc: "Tareas completadas según su frecuencia",
                    },
                  ] as const
                ).map(({ key, label, peso, desc }) => {
                  const value = Number(watchedValues[key]) || 0;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={key}>{label}</Label>
                          <p className="text-xs text-[#5B6980]">{desc}</p>
                        </div>
                        <span className="text-xs text-[#5B6980] shrink-0 ml-2">
                          peso {peso}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          id={key}
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          className="min-h-12 w-24 text-center text-lg font-bold"
                          {...register(key, { valueAsNumber: true })}
                        />
                        <div className="flex-1">
                          <div className="h-2.5 rounded-full bg-[#DDE3EA] overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                value >= 80
                                  ? "bg-[#2F6B2A]"
                                  : value >= 60
                                  ? "bg-[#D97706]"
                                  : "bg-[#B42318]"
                              )}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <p className="text-right text-xs text-[#5B6980] mt-0.5">{value}%</p>
                        </div>
                      </div>
                      {errors[key] && (
                        <p className="text-xs text-[#B42318]">{errors[key]?.message}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Preview del resultado */}
              {preview && (
                <div
                  className={cn(
                    "rounded-xl p-4 border-l-4",
                    SELLO_CONFIG[preview.nivel as NivelSello].border,
                    "bg-white border border-[#DDE3EA]"
                  )}
                >
                  <p className="text-xs text-[#5B6980] mb-1">Vista previa del sello</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#0B1B33]">
                        {preview.score_general.toFixed(1)}%
                      </span>
                      <span
                        className={cn(
                          "ml-3 text-sm font-semibold capitalize",
                          SELLO_CONFIG[preview.nivel as NivelSello].color
                        )}
                      >
                        {preview.nivel}
                      </span>
                    </div>
                    {preview.descargos_habilitados && (
                      <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 rounded-full px-2 py-1">
                        <IconSparkles size={12} />
                        Descargos
                      </div>
                    )}
                  </div>
                  {preview.plan_mejoras.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-[#334155]">
                      {preview.plan_mejoras.map((linea) => (
                        <li key={linea}>{linea}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending || propuesta.isLoading}
                className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
              >
                <IconMedal size={18} />
                {isPending ? "Emitiendo sello..." : "Confirmar y emitir sello"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
