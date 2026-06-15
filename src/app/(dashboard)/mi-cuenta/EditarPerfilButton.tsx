"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconPencil,
  IconX,
  IconLoader2,
  IconCircleCheck,
  IconKey,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schemaNombre = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
});

const schemaPassword = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

type TabId = "nombre" | "password";

interface Props {
  nombreActual?: string;
}

export function EditarPerfilButton({ nombreActual }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("nombre");
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const router = useRouter();

  const {
    register: registerNombre,
    handleSubmit: handleNombre,
    formState: { errors: errorsNombre, isSubmitting: submittingNombre },
    reset: resetNombre,
  } = useForm<z.infer<typeof schemaNombre>>({
    resolver: zodResolver(schemaNombre),
    defaultValues: { nombre: nombreActual ?? "" },
  });

  const {
    register: registerPwd,
    handleSubmit: handlePwd,
    formState: { errors: errorsPwd },
    reset: resetPwd,
  } = useForm<z.infer<typeof schemaPassword>>({
    resolver: zodResolver(schemaPassword),
  });

  function handleClose() {
    setOpen(false);
    setSuccess(null);
    setServerError(null);
    resetNombre({ nombre: nombreActual ?? "" });
    resetPwd();
  }

  async function onNombre(data: z.infer<typeof schemaNombre>) {
    setServerError(null);
    const res = await fetch("/api/auth/actualizar-perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: data.nombre }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      setServerError(err.error ?? "Error al actualizar el nombre");
      return;
    }
    setSuccess("Nombre actualizado correctamente.");
    router.refresh();
    setTimeout(handleClose, 1800);
  }

  async function onPassword(data: z.infer<typeof schemaPassword>) {
    setServerError(null);
    setLoadingPwd(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        setServerError(error.message);
        return;
      }
      setSuccess("Contraseña actualizada correctamente.");
      resetPwd();
      setTimeout(handleClose, 1800);
    } finally {
      setLoadingPwd(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-[#1A3559] border border-[#E2E8F0] rounded-lg px-3 py-1.5 hover:bg-[#F5F6F8] transition-colors"
      >
        <IconPencil size={14} />
        Editar perfil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <p className="font-semibold text-[#0D1F3C]">Editar perfil</p>
              <button onClick={handleClose} className="text-[#64748B] hover:text-[#0D1F3C]">
                <IconX size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E2E8F0]">
              {[
                { id: "nombre" as const, label: "Nombre", icon: IconPencil },
                { id: "password" as const, label: "Contraseña", icon: IconKey },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setSuccess(null); setServerError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    tab === id
                      ? "border-[#3D7A35] text-[#3D7A35]"
                      : "border-transparent text-[#64748B] hover:text-[#0D1F3C]"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Éxito */}
              {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                  <IconCircleCheck size={16} className="text-[#16A34A] shrink-0" />
                  <p className="text-sm text-[#16A34A] font-medium">{success}</p>
                </div>
              )}

              {/* Error servidor */}
              {serverError && (
                <p className="text-sm text-[#DC2626] bg-red-50 rounded-xl px-4 py-3 mb-4">
                  {serverError}
                </p>
              )}

              {/* Tab Nombre */}
              {tab === "nombre" && (
                <form onSubmit={handleNombre(onNombre)} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input
                      id="nombre"
                      className="mt-1 min-h-12"
                      placeholder="Tu nombre completo"
                      {...registerNombre("nombre")}
                    />
                    {errorsNombre.nombre && (
                      <p className="text-xs text-[#DC2626] mt-1">{errorsNombre.nombre.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={submittingNombre}
                    className="w-full min-h-12 bg-[#3D7A35] hover:bg-[#2D5A27] text-white gap-2"
                  >
                    {submittingNombre ? (
                      <IconLoader2 size={16} className="animate-spin" />
                    ) : (
                      <IconCircleCheck size={16} />
                    )}
                    Guardar nombre
                  </Button>
                </form>
              )}

              {/* Tab Contraseña */}
              {tab === "password" && (
                <form onSubmit={handlePwd(onPassword)} className="space-y-4">
                  <div>
                    <Label htmlFor="password">Nueva contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      className="mt-1 min-h-12"
                      placeholder="Mínimo 8 caracteres"
                      {...registerPwd("password")}
                    />
                    {errorsPwd.password && (
                      <p className="text-xs text-[#DC2626] mt-1">{errorsPwd.password.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmar">Confirmar contraseña</Label>
                    <Input
                      id="confirmar"
                      type="password"
                      className="mt-1 min-h-12"
                      placeholder="Repite la contraseña"
                      {...registerPwd("confirmar")}
                    />
                    {errorsPwd.confirmar && (
                      <p className="text-xs text-[#DC2626] mt-1">{errorsPwd.confirmar.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={loadingPwd}
                    className="w-full min-h-12 bg-[#1A3559] hover:bg-[#0D1F3C] text-white gap-2"
                  >
                    {loadingPwd ? (
                      <IconLoader2 size={16} className="animate-spin" />
                    ) : (
                      <IconKey size={16} />
                    )}
                    Cambiar contraseña
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
