"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  IconShield,
  IconX,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  accion: z.enum(["atendido", "rechazado"]),
  respuesta: z.string().min(10, "Describe cómo se atendió la solicitud (mín. 10 caracteres)"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  id: string;
  tipoDerecho: string;
  tenantNombre?: string;
}

const TIPO_LABEL: Record<string, string> = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  supresion: "Supresión",
  oposicion: "Oposición",
  portabilidad: "Portabilidad",
  bloqueo: "Bloqueo",
};

export function ResolverButton({ id, tipoDerecho, tenantNombre }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();

  const resolver = trpc.arsopb.resolver.useMutation({
    onSuccess: () => {
      utils.arsopb.panelAdmin.invalidate();
      setOpen(false);
      reset();
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accion: "atendido" },
  });

  const accion = watch("accion");

  async function onSubmit(data: FormData) {
    await resolver.mutateAsync({
      solicitud_id: id,
      accion: data.accion,
      respuesta: data.respuesta,
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 text-xs text-white bg-[#3D7A35] hover:bg-[#2D5A27] rounded-lg px-3 py-1.5 font-medium transition-colors"
      >
        Resolver
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <IconShield size={18} className="text-[#3D7A35]" />
                <p className="font-semibold text-[#0D1F3C] text-sm">
                  Resolver solicitud ARSOPB
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#64748B]">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Info */}
              <div className="bg-[#F5F6F8] rounded-xl p-3 space-y-1">
                <p className="text-xs text-[#64748B]">Tipo de derecho</p>
                <p className="text-sm font-semibold text-[#0D1F3C]">
                  {TIPO_LABEL[tipoDerecho] ?? tipoDerecho}
                  {tenantNombre && (
                    <span className="text-[#64748B] font-normal"> · {tenantNombre}</span>
                  )}
                </p>
              </div>

              {/* Acción */}
              <div>
                <Label className="block mb-2">Resultado</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["atendido", "rechazado"] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setValue("accion", op)}
                      className={`rounded-xl border-2 py-3 text-sm font-medium capitalize transition-colors ${
                        accion === op
                          ? op === "atendido"
                            ? "border-[#3D7A35] bg-[#EAF3E0] text-[#2D5A27]"
                            : "border-[#DC2626] bg-red-50 text-[#DC2626]"
                          : "border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]"
                      }`}
                    >
                      {op === "atendido" ? "✅ Atendida" : "❌ Rechazada"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Respuesta */}
              <div>
                <Label htmlFor="respuesta-arsopb">Detalle de la respuesta</Label>
                <textarea
                  id="respuesta-arsopb"
                  rows={4}
                  placeholder={
                    accion === "atendido"
                      ? "ej: Se proporcionaron los datos solicitados mediante correo electrónico el día..."
                      : "ej: La solicitud fue rechazada por no corresponder al titular identificado..."
                  }
                  {...register("respuesta")}
                  className="mt-1 flex w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A35] resize-none"
                />
                {errors.respuesta && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.respuesta.message}</p>
                )}
              </div>

              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
                <strong>Art. 24 Ley 21.719:</strong> El titular debe recibir respuesta dentro
                de 30 días corridos. Esta acción cerrará la solicitud y registrará la fecha
                de resolución.
              </div>

              {resolver.error && (
                <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
                  {resolver.error.message}
                </p>
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
                  disabled={resolver.isPending}
                  className="flex-1 bg-[#1A3559] hover:bg-[#0D1F3C] text-white gap-2"
                >
                  {resolver.isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconCircleCheck size={16} />
                  )}
                  {resolver.isPending ? "Guardando..." : "Confirmar resolución"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
