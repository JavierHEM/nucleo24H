"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconDroplets } from "@tabler/icons-react";
import { limpiezaSchema, type LimpiezaInput } from "@/lib/schemas/registros";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSuccess?: () => void;
}

export function FormLimpieza({ onSuccess }: Props) {
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
  } = useForm<LimpiezaInput>({
    resolver: zodResolver(limpiezaSchema),
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 16),
      conforme: true,
    },
  });

  async function onSubmit(data: LimpiezaInput) {
    await crearRegistro.mutateAsync({
      tipo: "limpieza",
      fecha: new Date(data.fecha).toISOString(),
      datos: {
        area: data.area,
        producto_utilizado: data.producto_utilizado,
        responsable: data.responsable,
        conforme: data.conforme,
        observaciones: data.observaciones ?? "",
      },
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#EAF3E0] flex items-center justify-center">
          <IconDroplets size={16} className="text-[#3D7A35]" />
        </div>
        <p className="font-semibold text-[#0D1F3C] text-sm">Registro de Limpieza</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {crearRegistro.error && (
          <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
            {crearRegistro.error.message}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="fecha-limp">Fecha y hora</Label>
            <Input
              id="fecha-limp"
              type="datetime-local"
              className="mt-1 min-h-12"
              {...register("fecha")}
            />
            {errors.fecha && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.fecha.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="responsable-limp">Responsable</Label>
            <Input
              id="responsable-limp"
              placeholder="Nombre del operario"
              className="mt-1 min-h-12"
              {...register("responsable")}
            />
            {errors.responsable && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.responsable.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="area">Área limpiada</Label>
            <Input
              id="area"
              placeholder="ej: Cocina, Cámara fría, Baños"
              className="mt-1 min-h-12"
              {...register("area")}
            />
            {errors.area && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.area.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="producto">Producto utilizado</Label>
            <Input
              id="producto"
              placeholder="ej: Cloro 0.5%, Amonio cuaternario"
              className="mt-1 min-h-12"
              {...register("producto_utilizado")}
            />
            {errors.producto_utilizado && (
              <p className="text-xs text-[#DC2626] mt-1">
                {errors.producto_utilizado.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="obs-limp">Observaciones (opcional)</Label>
          <Input
            id="obs-limp"
            placeholder="Alguna novedad relevante..."
            className="mt-1 min-h-12"
            {...register("observaciones")}
          />
        </div>

        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="conforme-limp"
            {...register("conforme")}
            className="w-4 h-4 rounded border-[#E2E8F0] text-[#3D7A35] accent-[#3D7A35]"
          />
          <Label htmlFor="conforme-limp" className="text-sm font-normal cursor-pointer">
            Limpieza conforme al procedimiento
          </Label>
        </div>

        <Button
          type="submit"
          disabled={crearRegistro.isPending}
          className="w-full min-h-12 bg-[#3D7A35] hover:bg-[#2D5A27] text-white gap-2"
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
