"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconUserPlus, IconX, IconCircleCheck, IconMail, IconUser } from "@tabler/icons-react";

const schema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

export function InvitarNucleoButton() {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    const res = await fetch("/api/admin/invitar-nucleo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setServerError(
        typeof json.error === "string" ? json.error : "No se pudo enviar la invitación."
      );
      return;
    }
    setSuccess(data.email);
    reset();
  }

  function close() {
    setOpen(false);
    setSuccess(null);
    setServerError("");
    reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1B33] text-white text-sm font-medium hover:bg-[#16294A] transition-colors"
      >
        <IconUserPlus size={16} />
        Invitar administrador
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#DDE3EA] p-6 w-full max-w-md z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#0B1B33]">Invitar administrador</h2>
                <p className="text-xs text-[#5B6980] mt-0.5">
                  La cuenta nueva entra a casa central. No se vincula a un local.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-[#94A3B8] hover:text-[#5B6980] transition-colors"
                aria-label="Cerrar"
              >
                <IconX size={20} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2F6B2A]/10 mb-3">
                  <IconCircleCheck size={28} className="text-[#2F6B2A]" />
                </div>
                <p className="font-semibold text-[#0B1B33]">Invitación enviada</p>
                <p className="text-sm text-[#5B6980] mt-1">{success}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <IconUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Nombre y apellido"
                      {...register("nombre")}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0B1B33] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]/30 focus:border-[#2F6B2A] transition"
                    />
                  </div>
                  {errors.nombre && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.nombre.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <IconMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      placeholder="correo@empresa.cl"
                      {...register("email")}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0B1B33] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]/30 focus:border-[#2F6B2A] transition"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.email.message}</p>
                  )}
                </div>

                <div className="bg-[#F4F6F3] rounded-xl p-3 text-xs text-[#5B6980]">
                  Si el correo ya pertenece a un local o a un asesor, la invitación se rechaza.
                  No se cambia el rol de una cuenta existente.
                </div>

                {serverError && (
                  <p className="text-xs text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                    {serverError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 py-2.5 rounded-xl border border-[#DDE3EA] text-[#5B6980] text-sm font-medium hover:bg-[#F4F6F3] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0B1B33] text-white text-sm font-medium hover:bg-[#16294A] transition disabled:opacity-60"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar invitación"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
