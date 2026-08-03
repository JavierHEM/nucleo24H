"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconPlus, IconX } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  tema: z.string().min(2, "Ingresa el tema de la capacitación"),
  fecha: z.string().min(1, "Selecciona la fecha"),
  asistentes: z.string().min(1),
  instructor: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NuevaCapacitacionButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { mutateAsync, isPending } = trpc.registros.crear.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await mutateAsync({
      tipo: "capacitacion",
      fecha: new Date(data.fecha).toISOString(),
      datos: {
        tema: data.tema,
        asistentes: parseInt(data.asistentes, 10),
        instructor: data.instructor,
      },
    });
    reset();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
        size="sm"
      >
        <IconPlus size={16} />
        Registrar
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <p className="font-semibold text-[#0B2545]">Nueva capacitación</p>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="text-[#64748B] hover:text-[#0B2545]"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <Label htmlFor="tema">Tema</Label>
                <Input
                  id="tema"
                  placeholder="ej: Manipulación segura de alimentos"
                  className="mt-1 min-h-12"
                  {...register("tema")}
                />
                {errors.tema && <p className="text-xs text-[#DC2626] mt-1">{errors.tema.message}</p>}
              </div>

              <div>
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  className="mt-1 min-h-12"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  {...register("fecha")}
                />
                {errors.fecha && <p className="text-xs text-[#DC2626] mt-1">{errors.fecha.message}</p>}
              </div>

              <div>
                <Label htmlFor="asistentes">N° de asistentes</Label>
                <Input
                  id="asistentes"
                  type="number"
                  min={1}
                  placeholder="ej: 5"
                  className="mt-1 min-h-12"
                  {...register("asistentes")}
                />
                {errors.asistentes && <p className="text-xs text-[#DC2626] mt-1">{errors.asistentes.message}</p>}
              </div>

              <div>
                <Label htmlFor="instructor">Instructor (opcional)</Label>
                <Input
                  id="instructor"
                  placeholder="ej: Asesor BPM"
                  className="mt-1 min-h-12"
                  {...register("instructor")}
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full min-h-12 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white"
              >
                {isPending ? "Guardando..." : "✅ Guardar capacitación"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
