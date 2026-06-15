"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconUserPlus, IconX, IconCircleCheck, IconMail, IconUser } from "@tabler/icons-react";

const schema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

export function InvitarAsesorButton() {
  const router = useRouter();
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
    const res = await fetch("/api/admin/invitar-asesor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setServerError(json.error ?? "Error al invitar al asesor.");
      return;
    }

    setSuccess(data.email);
    reset();
    setTimeout(() => {
      setSuccess(null);
      setOpen(false);
      router.refresh();
    }, 3000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3D7A35] text-white text-sm font-medium hover:bg-[#336B2C] transition-colors"
      >
        <IconUserPlus size={16} />
        Invitar asesor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-6 w-full max-w-md z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#0D2137]">Invitar asesor</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Se enviará un magic link al correo indicado.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#3D7A35]/10 mb-3">
                  <IconCircleCheck size={28} className="text-[#3D7A35]" />
                </div>
                <p className="font-semibold text-[#0D2137]">Invitación enviada</p>
                <p className="text-sm text-[#64748B] mt-1">{success}</p>
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
                      placeholder="María González"
                      {...register("nombre")}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0D2137] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A35]/30 focus:border-[#3D7A35] transition"
                    />
                  </div>
                  {errors.nombre && (
                    <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>
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
                      placeholder="asesor@nucleosur.cl"
                      {...register("email")}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0D2137] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A35]/30 focus:border-[#3D7A35] transition"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="bg-[#EAF3E0] rounded-xl p-3 text-xs text-[#2D5A27]">
                  El asesor recibirá un enlace para activar su cuenta y establecer una contraseña.
                  Su rol quedará configurado como <strong>asesor</strong>.
                </div>

                {serverError && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    {serverError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] text-sm font-medium hover:bg-[#F8FAFC] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#3D7A35] text-white text-sm font-medium hover:bg-[#336B2C] transition disabled:opacity-60"
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
