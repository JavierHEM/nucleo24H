"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    peso_documentacion: z.number().min(0).max(1),
    peso_condiciones: z.number().min(0).max(1),
    peso_capacitaciones: z.number().min(0).max(1),
    peso_tareas: z.number().min(0).max(1),
    umbral_intermedio: z.number().min(0).max(100),
    umbral_avanzado: z.number().min(0).max(100),
    umbral_premium: z.number().min(0).max(100),
  })
  .refine(
    (d) =>
      Math.abs(
        d.peso_documentacion + d.peso_condiciones + d.peso_capacitaciones + d.peso_tareas - 1
      ) < 0.001,
    { message: "La suma de los pesos debe ser exactamente 1.00", path: ["peso_tareas"] }
  )
  .refine((d) => d.umbral_intermedio < d.umbral_avanzado, {
    message: "Umbral intermedio debe ser menor al avanzado",
    path: ["umbral_avanzado"],
  })
  .refine((d) => d.umbral_avanzado < d.umbral_premium, {
    message: "Umbral avanzado debe ser menor al premium",
    path: ["umbral_premium"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  configActual?: {
    id: string;
    peso_documentacion: number;
    peso_condiciones: number;
    peso_capacitaciones: number;
    peso_tareas: number;
    umbral_intermedio: number;
    umbral_avanzado: number;
    umbral_premium: number;
  };
}

export function ConfiguracionSellosForm({ configActual }: Props) {
  const router = useRouter();
  const defaults = configActual ?? {
    peso_documentacion: 0.3,
    peso_condiciones: 0.25,
    peso_capacitaciones: 0.25,
    peso_tareas: 0.2,
    umbral_intermedio: 60,
    umbral_avanzado: 75,
    umbral_premium: 90,
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });

  const watchPesos = watch([
    "peso_documentacion",
    "peso_condiciones",
    "peso_capacitaciones",
    "peso_tareas",
  ]);
  const sumaPesos = watchPesos.reduce((acc, v) => acc + (Number(v) || 0), 0);

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/admin/configuracion-sellos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Pesos */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#0D1F3C] mb-4">Pesos por categoría</p>
        <div className="space-y-4">
          {(
            [
              { key: "peso_documentacion", label: "Documentación" },
              { key: "peso_condiciones", label: "Condiciones sanitarias" },
              { key: "peso_capacitaciones", label: "Capacitaciones" },
              { key: "peso_tareas", label: "Tareas (NC cerradas)" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor={key}>{label}</Label>
                <span className="text-xs text-[#64748B]">
                  {((Number(watch(key)) || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <Input
                id={key}
                type="number"
                step="0.05"
                min="0"
                max="1"
                className="min-h-12"
                {...register(key, { valueAsNumber: true })}
              />
            </div>
          ))}
          <div
            className={`text-sm font-medium ${
              Math.abs(sumaPesos - 1) < 0.001 ? "text-[#16A34A]" : "text-[#DC2626]"
            }`}
          >
            Suma total: {(sumaPesos * 100).toFixed(0)}%
            {Math.abs(sumaPesos - 1) >= 0.001 && " (debe ser 100%)"}
          </div>
          {errors.peso_tareas && (
            <p className="text-xs text-[#DC2626]">{errors.peso_tareas.message}</p>
          )}
        </div>
      </div>

      {/* Umbrales */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#0D1F3C] mb-4">Umbrales por nivel</p>
        <div className="space-y-4">
          {(
            [
              { key: "umbral_intermedio", label: "Intermedio 🟡", color: "text-amber-600" },
              { key: "umbral_avanzado", label: "Avanzado 🟢", color: "text-[#16A34A]" },
              { key: "umbral_premium", label: "Premium ⚫", color: "text-[#1C1917]" },
            ] as const
          ).map(({ key, label, color }) => (
            <div key={key}>
              <Label htmlFor={key} className={color}>
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                step="1"
                min="0"
                max="100"
                className="mt-1 min-h-12"
                {...register(key, { valueAsNumber: true })}
              />
              {errors[key] && (
                <p className="text-xs text-[#DC2626] mt-1">{errors[key]?.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="w-full min-h-12 bg-[#3D7A35] hover:bg-[#2D5A27] text-white"
      >
        {isSubmitting ? "Guardando..." : "Guardar configuración"}
      </Button>
    </form>
  );
}
