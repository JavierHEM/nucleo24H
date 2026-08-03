"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconPlus, IconX, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  titulo: z.string().min(3, "Mínimo 3 caracteres"),
  descripcion: z.string().optional(),
  frecuencia: z.enum(["diaria", "semanal", "mensual"]),
});

type FormData = z.infer<typeof schema>;

export function NuevaTareaButton() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const crear = trpc.tareas.crear.useMutation({
    onSuccess: () => {
      utils.tareas.list.invalidate();
      setOpen(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frecuencia: "diaria" },
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="bg-[#143556] hover:bg-[#0B2545] text-white gap-2"
      >
        <IconPlus size={16} />
        Nueva tarea
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <p className="font-semibold text-[#0B2545]">Nueva tarea</p>
              <button onClick={() => setOpen(false)} className="text-[#64748B]">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => crear.mutate(d))} className="p-5 space-y-4">
              <div>
                <Label htmlFor="titulo-t">Título de la tarea</Label>
                <Input
                  id="titulo-t"
                  placeholder="ej: Revisar temperatura cámara fría"
                  className="mt-1 min-h-12"
                  {...register("titulo")}
                />
                {errors.titulo && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.titulo.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="desc-t">Descripción (opcional)</Label>
                <Input
                  id="desc-t"
                  placeholder="Instrucciones adicionales..."
                  className="mt-1 min-h-12"
                  {...register("descripcion")}
                />
              </div>

              <div>
                <Label htmlFor="frec-t">Frecuencia</Label>
                <select
                  id="frec-t"
                  {...register("frecuencia")}
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]"
                >
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              {crear.error && (
                <p className="text-sm text-[#DC2626]">{crear.error.message}</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={crear.isPending}
                  className="flex-1 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
                >
                  {crear.isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    "Crear tarea"
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
