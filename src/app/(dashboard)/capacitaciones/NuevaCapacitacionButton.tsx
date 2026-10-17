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
  relator: z.string().min(2, "Indica quién relató"),
  asistente: z.string().min(2, "Indica al menos un asistente"),
  cargo: z.string().min(2, "Indica el cargo"),
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
      codigo: "R-BPM-10-04",
      fecha: new Date(`${data.fecha}T12:00:00`).toISOString(),
      datos: {
        procedimiento: "PR-BPM-10",
        tema: data.tema,
        fecha: data.fecha,
        relator: data.relator,
        asistentes: [{ nombre: data.asistente, cargo: data.cargo }],
      },
    });
    reset();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
        size="sm"
      >
        <IconPlus size={16} />
        Registrar
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <p className="font-semibold text-[#0B1B33]">Nueva capacitación</p>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="text-[#5B6980] hover:text-[#0B1B33]"
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
                {errors.tema && <p className="text-xs text-[#B42318] mt-1">{errors.tema.message}</p>}
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
                {errors.fecha && <p className="text-xs text-[#B42318] mt-1">{errors.fecha.message}</p>}
              </div>

              <div>
                <Label htmlFor="relator">Relator</Label>
                <Input
                  id="relator"
                  placeholder="ej: Asesor BPM"
                  className="mt-1 min-h-12"
                  {...register("relator")}
                />
                {errors.relator && <p className="text-xs text-[#B42318] mt-1">{errors.relator.message}</p>}
              </div>

              <div>
                <Label htmlFor="asistente">Asistente</Label>
                <Input
                  id="asistente"
                  placeholder="Nombre"
                  className="mt-1 min-h-12"
                  {...register("asistente")}
                />
                {errors.asistente && <p className="text-xs text-[#B42318] mt-1">{errors.asistente.message}</p>}
              </div>

              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  placeholder="ej: Cocinero"
                  className="mt-1 min-h-12"
                  {...register("cargo")}
                />
                {errors.cargo && <p className="text-xs text-[#B42318] mt-1">{errors.cargo.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white"
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
