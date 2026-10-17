"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCircleCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  evidencia: z.string().min(5, "Describe brevemente cómo se resolvió"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  ncId: string;
  descripcion: string;
  onSuccess?: () => void;
}

export function CerrarNcButton({ ncId, descripcion, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const cerrar = trpc.visitas.cerrarNC.useMutation({
    onSuccess: () => {
      utils.visitas.list.invalidate();
      setOpen(false);
      reset();
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await cerrar.mutateAsync({ nc_id: ncId, evidencia: data.evidencia });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[#2F6B2A] hover:text-[#255620] hover:underline flex items-center gap-1 mt-1.5"
      >
        <IconCircleCheck size={13} />
        Marcar como resuelta
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#DDE3EA]">
              <p className="font-semibold text-[#0B1B33] text-sm">Cerrar no conformidad</p>
              <button onClick={() => setOpen(false)} className="text-[#5B6980]">
                <IconX size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-[#F4F6F3] rounded-xl p-3">
                <p className="text-xs text-[#5B6980] mb-1">No conformidad</p>
                <p className="text-sm text-[#0B1B33] leading-snug">{descripcion}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label htmlFor="evidencia-nc">¿Cómo se resolvió?</Label>
                  <textarea
                    id="evidencia-nc"
                    rows={3}
                    placeholder="ej: Se limpió la cámara de frío y se calibró el termómetro..."
                    {...register("evidencia")}
                    className="mt-1 flex w-full rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A] resize-none"
                  />
                  {errors.evidencia && (
                    <p className="text-xs text-[#B42318] mt-1">{errors.evidencia.message}</p>
                  )}
                </div>

                {cerrar.error && (
                  <p className="text-xs text-[#B42318]">{cerrar.error.message}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={cerrar.isPending}
                    className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-1"
                  >
                    {cerrar.isPending ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconCircleCheck size={14} />
                    )}
                    Confirmar cierre
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
