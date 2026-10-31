"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconLoader2,
  IconMail,
  IconLock,
  IconCircleCheck,
  IconClipboardCheck,
  IconBell,
  IconShieldCheck,
  IconArrowLeft,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { APP_NAME, APP_LEGAL_NAME } from "@/lib/branding";

const FEATURES = [
  {
    icon: IconClipboardCheck,
    text: "Registros BPM y documentos centralizados",
  },
  {
    icon: IconBell,
    text: "Alertas antes de cada vencimiento",
  },
  {
    icon: IconShieldCheck,
    text: "Sellos verificables y listos para auditoría",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mensaje = searchParams.get("mensaje");
  const errorParam = searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  const invitacionRota = errorParam === "auth_callback" || errorParam === "missing_code";
  const [serverError, setServerError] = useState<string | null>(
    invitacionRota
      ? "Ese enlace no activó la cuenta. Pide que te reenvíen la invitación. No crees una cuenta nueva: la empresa ya está registrada."
      : errorParam === "cuenta_baja"
        ? "Esta cuenta está dada de baja. Contacta a Núcleo 24H."
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
      const baja = error.message.toLowerCase().includes("ban");
      setServerError(
        baja
          ? "Esta cuenta está dada de baja. Contacta a Núcleo 24H."
          : "Credenciales incorrectas. Verifica tu email y contraseña."
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel marca */}
      <aside className="relative hidden lg:flex w-[460px] xl:w-[500px] shrink-0 flex-col bg-[#0B1B33] px-10 xl:px-12 py-10 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 90%, rgba(75,139,46,0.18) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(20,53,86,0.8) 0%, transparent 55%)",
          }}
        />

        <Link href="/" className="relative z-10 flex items-center gap-3 no-underline">
          <BrandLogo variant="negativo" className="w-52" priority />
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <h1 className="text-[34px] font-extrabold text-white leading-[1.15] tracking-tight mb-4">
            Cumplimiento normativo{" "}
            <span className="text-[#2F6B2A]">sin complicaciones</span>
          </h1>
          <p className="text-[15px] text-white/60 leading-relaxed max-w-[320px] mb-10">
            Accede a tu panel para gestionar registros, documentos, alertas y sellos de tu
            establecimiento.
          </p>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-[9px] bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#2F6B2A]" />
                </span>
                <span className="text-sm font-medium text-white/75">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-white/30">
          <span>© {new Date().getFullYear()} {APP_LEGAL_NAME}</span>
          <span className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-full text-[11px] text-white/45">
            Osorno, Chile
          </span>
        </div>
      </aside>

      {/* Panel formulario */}
      <main className="relative flex-1 flex items-center justify-center px-4 sm:px-8 py-10 bg-[#F4F6F3]">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 15%, rgba(75,139,46,0.08) 0%, transparent 40%), radial-gradient(circle at 10% 80%, rgba(11,37,69,0.06) 0%, transparent 45%)",
          }}
        />

        <div className="relative w-full max-w-[400px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#5B6980] hover:text-[#0B1B33] mb-8 transition-colors"
          >
            <IconArrowLeft size={16} />
            Volver al inicio
          </Link>

          {/* Logo móvil */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <BrandLogo className="w-52 h-auto" priority />
          </div>

          <div className="bg-white rounded-2xl border border-[#E1E8EF] shadow-[0_8px_40px_rgba(11,37,69,0.08)] overflow-hidden">
            <div className="px-6 sm:px-8 pt-7 pb-2">
              <h2 className="text-2xl font-extrabold text-[#0B1B33] tracking-tight">
                Iniciar sesión
              </h2>
              <p className="text-sm text-[#7F8C8D] mt-1.5">
                Ingresa a tu cuenta de {APP_NAME}
              </p>
            </div>

            <div className="px-6 sm:px-8 pb-7 pt-5 space-y-5">
              {mensaje === "verifica-email" && (
                <div className="flex items-start gap-3 bg-[#E5F1E3] rounded-xl px-4 py-3">
                  <IconCircleCheck size={18} className="text-[#2F6B2A] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#0B1B33]">Revisa tu correo</p>
                    <p className="text-xs text-[#255620] mt-0.5">
                      Te enviamos un enlace de confirmación para activar tu cuenta.
                    </p>
                  </div>
                </div>
              )}

              {serverError && (
                <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-4 py-3">
                  {serverError}
                </p>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative mt-1.5">
                    <IconMail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@local.cl"
                      autoComplete="email"
                      className="pl-10 min-h-12 bg-[#F4F6F3] border-[#E1E8EF] focus-visible:ring-[#2F6B2A]"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-[#B42318] mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/login/recuperar"
                      className="text-xs font-medium text-[#2F6B2A] hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <IconLock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      className="pl-10 min-h-12 bg-[#F4F6F3] border-[#E1E8EF] focus-visible:ring-[#2F6B2A]"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-[#B42318] mt-1">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-12 mt-1 bg-[#0B1B33] hover:bg-[#081C33] text-white gap-2 shadow-[0_2px_8px_rgba(11,37,69,0.25)]"
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

              {!invitacionRota && (
                <p className="text-sm text-[#7F8C8D] text-center pt-1">
                  ¿No tienes cuenta?{" "}
                  <Link href="/register" className="text-[#2F6B2A] font-semibold hover:underline">
                    Crear cuenta
                  </Link>
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-center text-[#94A3B8] mt-6 lg:hidden">
            {APP_NAME} · Osorno, Chile
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B1B33]">
          <div className="w-8 h-8 border-2 border-[#2F6B2A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
