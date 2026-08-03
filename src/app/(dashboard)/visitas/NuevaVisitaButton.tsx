"use client";

import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  IconMapPin,
  IconX,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ncSchema = z.object({
  descripcion: z.string().min(5, "Describe la no conformidad"),
  severidad: z.enum(["menor", "mayor"]),
  fecha_limite: z.string().optional(),
});

const schema = z.object({
  tipo: z.enum(["programada", "sorpresa"]),
  fecha: z.string().min(1, "Selecciona la fecha de la visita"),
  hallazgos: z.string().optional(),
  no_conformidades: z.array(ncSchema).default([]),
});

type FormData = {
  tipo: "programada" | "sorpresa";
  fecha: string;
  hallazgos?: string;
  no_conformidades: z.infer<typeof ncSchema>[];
};

interface Props {
  tenantId: string;
}

export function NuevaVisitaButton({ tenantId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();

  const registrar = trpc.visitas.registrar.useMutation({
    onSuccess: () => {
      utils.visitas.list.invalidate();
      setOpen(false);
      reset();
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as Resolver<FormData, any>,
    defaultValues: {
      tipo: "programada",
      fecha: new Date().toISOString().slice(0, 10),
      no_conformidades: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "no_conformidades",
  });

  async function onSubmit(data: FormData) {
    await registrar.mutateAsync({
      tenant_id: tenantId,
      tipo: data.tipo,
      fecha: new Date(data.fecha).toISOString(),
      hallazgos: data.hallazgos,
      no_conformidades: data.no_conformidades.map((nc) => ({
        descripcion: nc.descripcion,
        severidad: nc.severidad,
        fecha_limite: nc.fecha_limite
          ? new Date(nc.fecha_limite).toISOString()
          : undefined,
      })),
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#143556] hover:bg-[#0B2545] text-white gap-2"
        size="sm"
      >
        <IconPlus size={16} />
        Nueva visita
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <IconMapPin size={18} className="text-[#4B8B2E]" />
                <p className="font-semibold text-[#0B2545]">Registrar visita</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#64748B]">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
              {/* Tipo y fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tipo-visita">Tipo de visita</Label>
                  <select
                    id="tipo-visita"
                    {...register("tipo")}
                    className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]"
                  >
                    <option value="programada">Programada</option>
                    <option value="sorpresa">Sorpresa</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="fecha-visita">Fecha</Label>
                  <Input
                    id="fecha-visita"
                    type="date"
                    className="mt-1 min-h-12"
                    {...register("fecha")}
                  />
                  {errors.fecha && (
                    <p className="text-xs text-[#DC2626] mt-1">{errors.fecha.message}</p>
                  )}
                </div>
              </div>

              {/* Hallazgos */}
              <div>
                <Label htmlFor="hallazgos">Hallazgos generales (opcional)</Label>
                <textarea
                  id="hallazgos"
                  rows={3}
                  placeholder="Resumen de lo observado durante la visita..."
                  {...register("hallazgos")}
                  className="mt-1 flex w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E] resize-none"
                />
              </div>

              {/* No conformidades */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>No conformidades ({fields.length})</Label>
                  <button
                    type="button"
                    onClick={() =>
                      append({ descripcion: "", severidad: "menor", fecha_limite: "" })
                    }
                    className="flex items-center gap-1 text-xs text-[#4B8B2E] font-medium hover:text-[#3A6E24]"
                  >
                    <IconPlus size={13} />
                    Agregar NC
                  </button>
                </div>

                {fields.length === 0 && (
                  <p className="text-xs text-[#94A3B8] text-center py-4 border border-dashed border-[#E2E8F0] rounded-xl">
                    Sin no conformidades. Haz clic en &ldquo;Agregar NC&rdquo; si corresponde.
                  </p>
                )}

                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="border border-[#E2E8F0] rounded-xl p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconAlertTriangle size={14} className="text-[#D97706]" />
                          <span className="text-xs font-semibold text-[#0B2545]">
                            NC {idx + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-[#94A3B8] hover:text-[#DC2626]"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>

                      <Input
                        placeholder="Describe la no conformidad..."
                        className="min-h-10 text-sm"
                        {...register(`no_conformidades.${idx}.descripcion`)}
                      />
                      {errors.no_conformidades?.[idx]?.descripcion && (
                        <p className="text-xs text-[#DC2626]">
                          {errors.no_conformidades[idx]?.descripcion?.message}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Severidad</Label>
                          <select
                            {...register(`no_conformidades.${idx}.severidad`)}
                            className="mt-1 flex min-h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]"
                          >
                        <option value="menor">Menor</option>
                          <option value="mayor">Mayor</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Fecha límite</Label>
                          <Input
                            type="date"
                            className="mt-1 min-h-10 text-sm"
                            {...register(`no_conformidades.${idx}.fecha_limite`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {registrar.error && (
                <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
                  {registrar.error.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={registrar.isPending}
                className="w-full min-h-12 bg-[#143556] hover:bg-[#0B2545] text-white gap-2"
              >
                {registrar.isPending ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  "Registrar visita"
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
