"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconBug } from "@tabler/icons-react";
import { plagasSchema, type PlagasInput } from "@/lib/schemas/registros";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSuccess?: () => void;
}

export function FormPlagas({ onSuccess }: Props) {
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
  } = useForm<PlagasInput>({
    resolver: zodResolver(plagasSchema),
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      conforme: true,
      tipo_servicio: "preventivo",
    },
  });

  async function onSubmit(data: PlagasInput) {
    await crearRegistro.mutateAsync({
      tipo: "plagas",
      fecha: new Date(data.fecha).toISOString(),
      datos: {
        empresa_fumigadora: data.empresa_fumigadora,
        tipo_servicio: data.tipo_servicio,
        areas_tratadas: data.areas_tratadas,
        productos_utilizados: data.productos_utilizados,
        proxima_visita: data.proxima_visita ?? "",
        responsable: data.responsable,
        conforme: data.conforme,
        observaciones: data.observaciones ?? "",
      },
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#EBF5E6] flex items-center justify-center">
          <IconBug size={16} className="text-[#4B8B2E]" />
        </div>
        <p className="font-semibold text-[#0B2545] text-sm">Control de Plagas</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {crearRegistro.error && (
          <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
            {crearRegistro.error.message}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="fecha-plagas">Fecha del servicio</Label>
            <Input
              id="fecha-plagas"
              type="date"
              className="mt-1 min-h-12"
              {...register("fecha")}
            />
            {errors.fecha && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.fecha.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="tipo_servicio">Tipo de servicio</Label>
            <select
              id="tipo_servicio"
              {...register("tipo_servicio")}
              className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]"
            >
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="empresa_fumigadora">Empresa fumigadora</Label>
          <Input
            id="empresa_fumigadora"
            placeholder="Nombre de la empresa"
            className="mt-1 min-h-12"
            {...register("empresa_fumigadora")}
          />
          {errors.empresa_fumigadora && (
            <p className="text-xs text-[#DC2626] mt-1">{errors.empresa_fumigadora.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="areas_tratadas">Áreas tratadas</Label>
          <Input
            id="areas_tratadas"
            placeholder="ej: Cocina, comedor, bodega"
            className="mt-1 min-h-12"
            {...register("areas_tratadas")}
          />
          {errors.areas_tratadas && (
            <p className="text-xs text-[#DC2626] mt-1">{errors.areas_tratadas.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="productos_utilizados">Productos utilizados</Label>
          <Input
            id="productos_utilizados"
            placeholder="ej: Cipermetrina 10% + cebo de cucaracha"
            className="mt-1 min-h-12"
            {...register("productos_utilizados")}
          />
          {errors.productos_utilizados && (
            <p className="text-xs text-[#DC2626] mt-1">{errors.productos_utilizados.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="responsable-plagas">Responsable del local</Label>
            <Input
              id="responsable-plagas"
              placeholder="Nombre del receptor"
              className="mt-1 min-h-12"
              {...register("responsable")}
            />
            {errors.responsable && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.responsable.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="proxima_visita">Próxima visita (opcional)</Label>
            <Input
              id="proxima_visita"
              type="date"
              className="mt-1 min-h-12"
              {...register("proxima_visita")}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="obs-plagas">Observaciones (opcional)</Label>
          <Input
            id="obs-plagas"
            placeholder="Novedades o indicaciones adicionales"
            className="mt-1 min-h-12"
            {...register("observaciones")}
          />
        </div>

        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="conforme-plagas"
            {...register("conforme")}
            className="w-4 h-4 rounded border-[#E2E8F0] text-[#4B8B2E] accent-[#4B8B2E]"
          />
          <Label htmlFor="conforme-plagas" className="text-sm font-normal cursor-pointer">
            El servicio se realizó conforme a lo esperado
          </Label>
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
