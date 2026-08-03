"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconTemperature } from "@tabler/icons-react";
import { temperaturaSchema, type TemperaturaInput } from "@/lib/schemas/registros";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSuccess?: () => void;
}

export function FormTemperatura({ onSuccess }: Props) {
  const utils = trpc.useUtils();

  const crearRegistro = trpc.registros.crear.useMutation({
    onSuccess: () => {
      utils.registros.list.invalidate();
      reset();
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemperaturaInput>({
    resolver: zodResolver(temperaturaSchema),
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 16),
    },
  });

  async function onSubmit(data: TemperaturaInput) {
    await crearRegistro.mutateAsync({
      tipo: "temperatura",
      fecha: new Date(data.fecha).toISOString(),
      datos: {
        temperatura_ingreso: data.temperatura_ingreso,
        temperatura_almacenamiento: data.temperatura_almacenamiento,
        responsable: data.responsable,
        observaciones: data.observaciones ?? "",
      },
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <IconTemperature size={16} className="text-blue-500" />
        </div>
        <p className="font-semibold text-[#0B2545] text-sm">Control de Temperatura</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {crearRegistro.error && (
          <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
            {crearRegistro.error.message}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="fecha-temp">Fecha y hora</Label>
            <Input
              id="fecha-temp"
              type="datetime-local"
              className="mt-1 min-h-12"
              {...register("fecha")}
            />
            {errors.fecha && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.fecha.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="responsable-temp">Responsable</Label>
            <Input
              id="responsable-temp"
              placeholder="Nombre del operario"
              className="mt-1 min-h-12"
              {...register("responsable")}
            />
            {errors.responsable && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.responsable.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="temp-ingreso">Temperatura ingreso (°C)</Label>
            <Input
              id="temp-ingreso"
              type="number"
              step="0.1"
              placeholder="ej: 4.5"
              className="mt-1 min-h-12"
              {...register("temperatura_ingreso", { valueAsNumber: true })}
            />
            {errors.temperatura_ingreso && (
              <p className="text-xs text-[#DC2626] mt-1">
                {errors.temperatura_ingreso.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="temp-almacen">Temperatura almacenamiento (°C)</Label>
            <Input
              id="temp-almacen"
              type="number"
              step="0.1"
              placeholder="ej: 3.2"
              className="mt-1 min-h-12"
              {...register("temperatura_almacenamiento", { valueAsNumber: true })}
            />
            {errors.temperatura_almacenamiento && (
              <p className="text-xs text-[#DC2626] mt-1">
                {errors.temperatura_almacenamiento.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="obs-temp">Observaciones (opcional)</Label>
          <Input
            id="obs-temp"
            placeholder="Alguna novedad relevante..."
            className="mt-1 min-h-12"
            {...register("observaciones")}
          />
        </div>

        <Button
          type="submit"
          disabled={crearRegistro.isPending}
          className="w-full min-h-12 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
        >
          {crearRegistro.isPending ? (
            <>
              <IconLoader2 size={16} className="animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar registro"
          )}
        </Button>
      </form>
    </div>
  );
}
