"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { IconShieldCheck, IconLoader2, IconUser, IconLock } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";

const schema = z
  .object({
    nombre: z.string().min(2, "Ingresa tu nombre completo"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar: z.string().min(8, "Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

type FormData = z.infer<typeof schema>;

export function OnboardingForm({ next, nombreInicial }: { next: string; nombreInicial: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "done">("form");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: nombreInicial, password: "", confirmar: "" },
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const supabase = createClient();

    const { error: pwError } = await supabase.auth.updateUser({
      password: data.password,
      data: { nombre: data.nombre, clave_definida: true },
    });

    if (pwError) {
      setServerError(
        pwError.message.includes("same password")
          ? "Por favor elige una contraseña diferente."
          : `Error: ${pwError.message}`
      );
      return;
    }

    await fetch("/api/auth/actualizar-perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: data.nombre }),
    }).catch(() => {});

    setStep("done");
    setTimeout(() => {
      router.push(next);
      router.refresh();
    }, 800);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F3] px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo className="w-52" priority />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#DDE3EA] overflow-hidden">
          {step === "done" ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#E5F1E3] flex items-center justify-center mx-auto mb-4">
                <IconShieldCheck size={28} className="text-[#2F6B2A]" />
              </div>
              <h2 className="text-lg font-bold text-[#0B1B33] mb-1">¡Cuenta configurada!</h2>
              <p className="text-sm text-[#5B6980]">Entrando al panel…</p>
            </div>
          ) : (
            <>
              <div className="bg-[#0B1B33] px-6 py-5">
                <h1 className="text-white font-bold text-lg">Bienvenido a Núcleo 24H</h1>
                <p className="text-white/60 text-sm mt-0.5">Configura tu cuenta para comenzar</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                {serverError && (
                  <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-4 py-3">{serverError}</p>
                )}

                <div>
                  <Label htmlFor="nombre-ob">Nombre completo</Label>
                  <div className="relative mt-1">
                    <IconUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6980]" />
                    <Input id="nombre-ob" placeholder="Juan González" className="pl-9 min-h-12" {...register("nombre")} />
                  </div>
                  {errors.nombre && <p className="text-xs text-[#B42318] mt-1">{errors.nombre.message}</p>}
                </div>

                <div>
                  <Label htmlFor="pw-ob">Contraseña nueva</Label>
                  <div className="relative mt-1">
                    <IconLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6980]" />
                    <Input
                      id="pw-ob"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      className="pl-9 min-h-12"
                      autoComplete="new-password"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-[#B42318] mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <Label htmlFor="confirm-ob">Confirmar contraseña</Label>
                  <div className="relative mt-1">
                    <IconLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6980]" />
                    <Input
                      id="confirm-ob"
                      type="password"
                      placeholder="Repite la contraseña"
                      className="pl-9 min-h-12"
                      autoComplete="new-password"
                      {...register("confirmar")}
                    />
                  </div>
                  {errors.confirmar && (
                    <p className="text-xs text-[#B42318] mt-1">{errors.confirmar.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" /> Configurando...
                    </>
                  ) : (
                    "Confirmar y entrar al panel"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
