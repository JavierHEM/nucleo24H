"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconLoader2,
  IconExternalLink,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import { APP_NAME } from "@/lib/branding";

const PLANES = [
  {
    value: "calidad" as const,
    label: "Plan Calidad",
    precio: "$80.000 CLP/mes",
    descripcion: "BPM, documentos, capacitaciones y sellos",
  },
  {
    value: "integral" as const,
    label: "Plan Integral",
    precio: "$150.000 CLP/mes",
    descripcion: "Todo lo anterior + gestión ambiental y Ventanilla Única",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"calidad" | "integral">("calidad");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { plan: "calidad" },
  });

  const consentimientoDatos = watch("consentimiento_datos");
  const consentimientoTerminos = watch("consentimiento_terminos");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          nombre_local: data.nombre_local,
          rut_local: data.rut_local,
          direccion: data.direccion,
          plan: data.plan,
        },
      },
    });

    if (error) {
      setServerError(
        error.message.includes("already registered") || error.message.includes("already been registered")
          ? "Este email ya está registrado. ¿Olvidaste tu contraseña?"
          : `Error al registrarse: ${error.message}`
      );
      return;
    }

    router.push("/login?mensaje=verifica-email");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <BrandLogo className="w-36 h-auto" priority />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          {/* Header */}
          <div className="bg-[#0B2545] px-6 py-5">
            <h1 className="text-white font-bold text-lg">Crear cuenta</h1>
            <p className="text-white/60 text-sm mt-0.5">
              Comienza a gestionar el cumplimiento sanitario de tu local
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {serverError && (
              <p className="text-sm text-[#DC2626] bg-red-50 rounded-xl px-4 py-3">
                {serverError}
              </p>
            )}

            {/* Plan selector */}
            <div>
              <Label className="block mb-2">Selecciona tu plan</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PLANES.map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan.value);
                      setValue("plan", plan.value);
                    }}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-colors",
                      selectedPlan === plan.value
                        ? "border-[#4B8B2E] bg-[#EBF5E6]"
                        : "border-[#E2E8F0] hover:border-[#4B8B2E]/50"
                    )}
                  >
                    <p className="font-semibold text-[#0B2545] text-sm">{plan.label}</p>
                    <p className="text-sm font-medium text-[#4B8B2E] mt-0.5">
                      {plan.precio}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">{plan.descripcion}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Datos personales */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nombre">Tu nombre completo</Label>
                <Input
                  id="nombre"
                  placeholder="Juan González"
                  className="mt-1 min-h-12"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@local.cl"
                  autoComplete="email"
                  className="mt-1 min-h-12"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="mt-1 min-h-12"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Datos del local */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                Datos del local
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                <div className="sm:col-span-2">
                  <Label htmlFor="nombre_local">Nombre del local</Label>
                  <Input
                    id="nombre_local"
                    placeholder="Restaurante El Sur"
                    className="mt-1 min-h-12"
                    {...register("nombre_local")}
                  />
                  {errors.nombre_local && (
                    <p className="text-xs text-[#DC2626] mt-1">{errors.nombre_local.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="rut_local">RUT del local</Label>
                  <Input
                    id="rut_local"
                    placeholder="12.345.678-9"
                    className="mt-1 min-h-12"
                    {...register("rut_local")}
                  />
                  {errors.rut_local && (
                    <p className="text-xs text-[#DC2626] mt-1">{errors.rut_local.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    placeholder="Av. Freire 123, Osorno"
                    className="mt-1 min-h-12"
                    {...register("direccion")}
                  />
                  {errors.direccion && (
                    <p className="text-xs text-[#DC2626] mt-1">{errors.direccion.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Consentimientos Ley 21.719 */}
            <div className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] p-4">
              <p className="text-xs font-semibold text-[#0B2545]">
                Consentimientos requeridos (Art. 12 Ley 21.719)
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] accent-[#4B8B2E]"
                  checked={consentimientoDatos ?? false}
                  onChange={(e) => setValue("consentimiento_datos", e.target.checked)}
                />
                <span className="text-xs text-[#64748B] leading-relaxed">
                  Acepto el tratamiento de mis datos personales conforme a la{" "}
                  <Link
                    href="/politica-de-privacidad"
                    target="_blank"
                    className="text-[#4B8B2E] font-medium hover:underline inline-flex items-center gap-0.5"
                  >
                    Política de Privacidad
                    <IconExternalLink size={11} />
                  </Link>{" "}
                  de {APP_NAME}.
                </span>
              </label>
              {errors.consentimiento_datos && (
                <p className="text-xs text-[#DC2626] pl-7">
                  {errors.consentimiento_datos.message}
                </p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] accent-[#4B8B2E]"
                  checked={consentimientoTerminos ?? false}
                  onChange={(e) => setValue("consentimiento_terminos", e.target.checked)}
                />
                <span className="text-xs text-[#64748B]">
                  Acepto los términos y condiciones del servicio de {APP_NAME}.
                </span>
              </label>
              {errors.consentimiento_terminos && (
                <p className="text-xs text-[#DC2626] pl-7">
                  {errors.consentimiento_terminos.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-12 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 size={16} className="animate-spin" /> Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>

            <p className="text-sm text-[#64748B] text-center">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#4B8B2E] font-medium hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
