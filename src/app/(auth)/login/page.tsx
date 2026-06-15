"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconShieldCheck,
  IconLoader2,
  IconMail,
  IconLock,
  IconCircleCheck,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mensaje = searchParams.get("mensaje");
  const errorParam = searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  const [serverError, setServerError] = useState<string | null>(
    errorParam === "auth_callback"
      ? "El enlace de invitación ha expirado. Solicita uno nuevo."
      : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError("Credenciales incorrectas. Verifica tu email y contraseña.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#0D1F3C] flex items-center justify-center">
            <IconShieldCheck size={22} className="text-[#3D7A35]" />
          </div>
          <span className="text-xl font-bold text-[#0D1F3C]">Núcleo Sur</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          {/* Header */}
          <div className="bg-[#0D1F3C] px-6 py-5">
            <h1 className="text-white font-bold text-lg">Iniciar sesión</h1>
            <p className="text-white/60 text-sm mt-0.5">
              Accede a tu plataforma de cumplimiento sanitario
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Mensaje de éxito (ej: email verificado) */}
            {mensaje === "verifica-email" && (
              <div className="flex items-start gap-3 bg-[#EAF3E0] rounded-xl px-4 py-3">
                <IconCircleCheck size={18} className="text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#0D1F3C]">Revisa tu correo</p>
                  <p className="text-xs text-[#2D5A27] mt-0.5">
                    Te enviamos un enlace de confirmación para activar tu cuenta.
                  </p>
                </div>
              </div>
            )}

            {serverError && (
              <p className="text-sm text-[#DC2626] bg-red-50 rounded-xl px-4 py-3">
                {serverError}
              </p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative mt-1">
                  <IconMail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@local.cl"
                    autoComplete="email"
                    className="pl-9 min-h-12"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/login/recuperar"
                    className="text-xs text-[#3D7A35] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <IconLock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="pl-9 min-h-12"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-12 bg-[#1A3559] hover:bg-[#0D1F3C] text-white gap-2"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" /> Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>

            <p className="text-sm text-[#64748B] text-center">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-[#3D7A35] font-medium hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-center text-[#94A3B8] mt-6">
          Núcleo Sur · Gestión BPM para establecimientos de alimentos
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <div className="w-8 h-8 border-2 border-[#3D7A35] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
