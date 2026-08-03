"use client";

import { useState } from "react";
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

  // Preview en tiempo real del sello calculado
  let preview: ReturnType<typeof calcularSello> | null = null;
  try {
    preview = calcularSello({
      score_documentacion: Number(watchedValues.score_documentacion) || 0,
      score_condiciones: Number(watchedValues.score_condiciones) || 0,
      score_capacitaciones: Number(watchedValues.score_capacitaciones) || 0,
      score_tareas: Number(watchedValues.score_tareas) || 0,
      pesos: PESOS_DEFAULT,
      umbrales: UMBRALES_DEFAULT,
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
        className="bg-[#143556] hover:bg-[#0B2545] text-white gap-2 shrink-0"
        size="sm"
      >
        <IconMedal size={16} />
        Emitir sello
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <IconMedal size={20} className="text-[#4B8B2E]" />
                <p className="font-semibold text-[#0B2545]">Emitir sello mensual</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#64748B]">
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
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]"
                />
                {errors.periodo && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.periodo.message}</p>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 bg-[#EBF5E6] rounded-xl p-3 text-xs text-[#3A6E24]">
                <IconInfoCircle size={15} className="shrink-0 mt-0.5" />
                <p>
                  Ingresa el porcentaje de cumplimiento de cada dimensión según lo observado en la visita.
                  Los pesos se obtienen de la configuración global del sello.
                </p>
              </div>

              {/* Scores */}
              <div className="space-y-4">
                {(
                  [
                    {
                      key: "score_documentacion" as const,
                      label: "Documentación y registros BPM",
                      peso: "30%",
                      desc: "Documentos vigentes, registros de temperatura, limpieza",
                    },
                    {
                      key: "score_condiciones" as const,
                      label: "Condiciones sanitarias del local",
                      peso: "25%",
                      desc: "Estado general, equipos, higiene estructural",
                    },
                    {
                      key: "score_capacitaciones" as const,
                      label: "Capacitaciones del equipo",
                      peso: "25%",
                      desc: "Asistencia y comprensión del personal",
                    },
                    {
                      key: "score_tareas" as const,
                      label: "Tareas / No conformidades cerradas",
                      peso: "20%",
                      desc: "Porcentaje de NC resueltas del período",
                    },
                  ] as const
                ).map(({ key, label, peso, desc }) => {
                  const value = Number(watchedValues[key]) || 0;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={key}>{label}</Label>
                          <p className="text-xs text-[#64748B]">{desc}</p>
                        </div>
                        <span className="text-xs text-[#64748B] shrink-0 ml-2">
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
                          <div className="h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                value >= 80
                                  ? "bg-[#16A34A]"
                                  : value >= 60
                                  ? "bg-[#D97706]"
                                  : "bg-[#DC2626]"
                              )}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <p className="text-right text-xs text-[#64748B] mt-0.5">{value}%</p>
                        </div>
                      </div>
                      {errors[key] && (
                        <p className="text-xs text-[#DC2626]">{errors[key]?.message}</p>
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
                    "bg-white border border-[#E2E8F0]"
                  )}
                >
                  <p className="text-xs text-[#64748B] mb-1">Vista previa del sello</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#0B2545]">
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
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full min-h-12 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
              >
                <IconMedal size={18} />
                {isPending ? "Emitiendo sello..." : "✅ Confirmar y emitir sello"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
