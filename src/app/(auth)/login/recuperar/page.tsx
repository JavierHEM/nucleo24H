"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconArrowLeft, IconMail, IconCircleCheck } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

function RecuperarForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/cuenta/nueva-clave`,
    });
    if (error) {
      setServerError("No pudimos enviar el correo. Intenta más tarde.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4B8B2E]/10 mb-4">
            <IconCircleCheck size={32} className="text-[#4B8B2E]" />
          </div>
          <h1 className="text-xl font-semibold text-[#0D2137] mb-2">
            Revisa tu correo
          </h1>
          <p className="text-[#64748B] text-sm mb-6">
            Si <span className="font-medium text-[#0D2137]">{getValues("email")}</span> está registrado,
            recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#4B8B2E] font-medium hover:underline"
          >
            <IconArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0D2137] mb-8 transition-colors"
        >
          <IconArrowLeft size={16} />
          Volver
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D2137]/5 mb-4">
              <IconMail size={22} className="text-[#0D2137]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0D2137] mb-1">
              Recuperar contraseña
            </h1>
            <p className="text-sm text-[#64748B]">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                {...register("email")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0D2137] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]/30 focus:border-[#4B8B2E] transition"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
              {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-2 border-[#4B8B2E] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RecuperarForm />
    </Suspense>
  );
}
