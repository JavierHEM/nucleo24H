"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconX,
  IconLoader2,
  IconMailForward,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Ingresa el nombre del local"),
  rut: z.string().min(8, "RUT inválido"),
  plan: z.enum(["calidad", "integral"]),
  direccion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function InvitarLocalButton() {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: "calidad" },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/admin/invitar-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError("root", {
        message:
          typeof json.error === "string"
            ? json.error
            : "Error al crear el local",
      });
      return;
    }

    setSuccess(
      (json as { message?: string }).message ?? "Local creado e invitación enviada"
    );
    reset();
    router.refresh();
  }

  function handleClose() {
    setOpen(false);
    setSuccess(null);
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
        Nueva empresa
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <p className="font-semibold text-[#0B1B33]">
                {success ? "Empresa creada" : "Nueva empresa"}
              </p>
              <button onClick={handleClose} className="text-[#5B6980]">
                <IconX size={20} />
              </button>
            </div>

            {/* Success */}
            {success ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#E5F1E3] flex items-center justify-center mx-auto mb-4">
                  <IconCircleCheck size={28} className="text-[#2F6B2A]" />
                </div>
                <p className="font-semibold text-[#0B1B33] mb-1">Empresa creada</p>
                <p className="text-sm text-[#5B6980]">{success}</p>
                <p className="text-xs text-[#94A3B8] mt-2">
                  El usuario recibirá un email para configurar su cuenta.
                </p>
                <Button
                  className="mt-6 w-full bg-[#16294A] hover:bg-[#0B1B33] text-white"
                  onClick={handleClose}
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Email */}
                <div>
                  <Label htmlFor="email-local">Email del administrador del local</Label>
                  <div className="relative mt-1">
                    <IconMailForward
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6980]"
                    />
                    <Input
                      id="email-local"
                      type="email"
                      placeholder="admin@restaurante.cl"
                      className="pl-9 min-h-12"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-[#B42318] mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <Label htmlFor="nombre-local">Nombre de la casa central</Label>
                  <Input
                    id="nombre-local"
                    placeholder="Restaurante El Marino"
                    className="mt-1 min-h-12"
                    {...register("nombre")}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-[#B42318] mt-1">{errors.nombre.message}</p>
                  )}
                </div>

                {/* RUT y Plan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="rut-local">RUT</Label>
                    <Input
                      id="rut-local"
                      placeholder="12.345.678-9"
                      className="mt-1 min-h-12"
                      {...register("rut")}
                    />
                    <p className="text-[11px] text-[#94A3B8] mt-1">
                      Las sucursales se agregan después y comparten este RUT.
                    </p>
                    {errors.rut && (
                      <p className="text-xs text-[#B42318] mt-1">{errors.rut.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="plan-local">Plan</Label>
                    <select
                      id="plan-local"
                      {...register("plan")}
                      className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                    >
                      <option value="calidad">Calidad — $80.000/mes</option>
                      <option value="integral">Integral — $150.000/mes</option>
                    </select>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <Label htmlFor="direccion-local">Dirección (opcional)</Label>
                  <Input
                    id="direccion-local"
                    placeholder="Av. Ramón Freire 1234, Osorno"
                    className="mt-1 min-h-12"
                    {...register("direccion")}
                  />
                </div>

                {errors.root && (
                  <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                    {errors.root.message}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <IconLoader2 size={16} className="animate-spin" /> Creando...
                      </>
                    ) : (
                      "Crear y enviar invitación"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
