"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconLock, IconCircleCheck, IconEye, IconEyeOff } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

function NuevaClaveForm() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setServerError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4B8B2E]/10 mb-4">
            <IconCircleCheck size={32} className="text-[#4B8B2E]" />
          </div>
          <h1 className="text-xl font-semibold text-[#0D2137] mb-2">
            Contraseña actualizada
          </h1>
          <p className="text-[#64748B] text-sm">
            Redirigiendo al panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D2137]/5 mb-4">
              <IconLock size={22} className="text-[#0D2137]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0D2137] mb-1">
              Nueva contraseña
            </h1>
            <p className="text-sm text-[#64748B]">
              Elige una contraseña segura para tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...register("password")}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#CBD5E1] bg-white text-[#0D2137] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]/30 focus:border-[#4B8B2E] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  {showPwd ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                {...register("confirm")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0D2137] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]/30 focus:border-[#4B8B2E] transition"
              />
              {errors.confirm && (
                <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-[#4B8B2E] text-white font-semibold text-sm hover:bg-[#336B2C] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NuevaClavePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-2 border-[#4B8B2E] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NuevaClaveForm />
    </Suspense>
  );
}
