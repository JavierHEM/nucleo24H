"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCircleCheck, IconLoader2, IconMail, IconMailForward, IconX } from "@tabler/icons-react";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

export function ReenviarInvitacionButton({
  userId,
  email,
  compact = false,
}: {
  userId?: string;
  email?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "listo" | "error">("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: email ?? "" },
  });

  function close() {
    setOpen(false);
    setEstado("idle");
    setMensaje(null);
    reset({ email: email ?? "" });
  }

  async function reenviar(payload: { userId?: string; email?: string }) {
    setEstado("enviando");
    setMensaje(null);
    const res = await fetch("/api/admin/reenviar-invitacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!res.ok) {
      setEstado("error");
      setMensaje(json.error ?? "No se pudo reenviar.");
      return false;
    }
    setEstado("listo");
    setMensaje(json.message ?? "Invitación reenviada.");
    return true;
  }

  async function onSubmit(data: FormData) {
    await reenviar({ email: data.email });
  }

  async function reenviarDirecto() {
    if (!userId && !email) return;
    await reenviar({ userId, email });
  }

  if (compact) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => void reenviarDirecto()}
          disabled={estado === "enviando"}
          className="flex items-center gap-1 text-xs text-[#16294A] hover:text-[#2F6B2A] border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 hover:bg-[#E5F1E3] transition-colors disabled:opacity-50"
        >
          {estado === "enviando" ? (
            <IconLoader2 size={13} className="animate-spin" />
          ) : (
            <IconMailForward size={13} />
          )}
          Reenviar
        </button>
        {mensaje && (
          <span className={`max-w-52 text-right text-[11px] ${estado === "error" ? "text-[#B42318]" : "text-[#255620]"}`}>
            {mensaje}
          </span>
        )}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DDE3EA] bg-white text-[#16294A] text-sm font-medium hover:bg-[#F4F6F3] transition-colors"
      >
        <IconMailForward size={16} />
        Reenviar invitación
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#DDE3EA] p-6 w-full max-w-md z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#0B1B33]">Reenviar invitación</h2>
                <p className="text-xs text-[#5B6980] mt-0.5">
                  Sirve para Núcleo, asesores y locales que aún no crearon su clave.
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

            {estado === "listo" ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2F6B2A]/10 mb-3">
                  <IconCircleCheck size={28} className="text-[#2F6B2A]" />
                </div>
                <p className="font-semibold text-[#0B1B33]">Invitación reenviada</p>
                <p className="text-sm text-[#5B6980] mt-1">{mensaje}</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0B1B33] text-white text-sm font-medium"
                >
                  Listo
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  El enlace anterior deja de servir. Si esa persona ya creó su clave, tiene que entrar por login.
                </div>

                {mensaje && estado === "error" && (
                  <p className="text-xs text-[#B42318] bg-red-50 rounded-lg px-3 py-2">{mensaje}</p>
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
                    {isSubmitting ? "Enviando..." : "Reenviar"}
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
