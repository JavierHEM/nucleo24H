"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { diagnosticoSchema, TIPOS_LOCAL_DIAGNOSTICO, type DiagnosticoInput } from "@/lib/diagnostico";
import { solicitarDiagnostico } from "./actions";

const CLASE_INPUT =
  "min-h-[52px] rounded-[10px] border-2 border-[#C3CCD8] px-3.5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341] aria-[invalid=true]:border-[#9A1C12]";

export function DiagnosticoForm() {
  const [enviado, setEnviado] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [pendiente, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiagnosticoInput>({
    resolver: zodResolver(diagnosticoSchema),
    defaultValues: { tipo: "Restaurante" },
  });

  function onSubmit(valores: DiagnosticoInput) {
    setErrorServidor(null);
    iniciarEnvio(async () => {
      const resultado = await solicitarDiagnostico(valores);
      if ("error" in resultado) {
        setErrorServidor(resultado.error);
        return;
      }
      setEnviado(true);
      reset({ tipo: "Restaurante" });
    });
  }

  if (enviado) {
    return (
      <div
        role="status"
        className="flex-1 basis-[420px] bg-white text-[#0B1B33] rounded-[20px] p-8 flex flex-col gap-3 justify-center"
      >
        <h3 className="text-2xl font-extrabold">Recibimos tu solicitud</h3>
        <p className="text-base font-semibold text-[#41506A]">
          Te contactaremos para coordinar tu diagnóstico. Gracias por confiar en Núcleo 24H.
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="self-start min-h-[44px] text-sm font-extrabold text-[#2F6B2A] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341]"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex-1 basis-[420px] bg-white text-[#0B1B33] rounded-[20px] p-8 flex flex-col gap-4"
      aria-label="Solicitar diagnóstico"
    >
      <h3 className="text-2xl font-extrabold">Cuéntanos de tu local</h3>

      <Campo id="f-nombre" label="Tu nombre" error={errors.nombre?.message}>
        <input
          id="f-nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? "f-nombre-error" : undefined}
          className={CLASE_INPUT}
          {...register("nombre")}
        />
      </Campo>

      <Campo id="f-local" label="Nombre del local" error={errors.local?.message}>
        <input
          id="f-local"
          autoComplete="organization"
          placeholder="Restaurante, cafetería o food truck"
          aria-invalid={Boolean(errors.local)}
          aria-describedby={errors.local ? "f-local-error" : undefined}
          className={CLASE_INPUT}
          {...register("local")}
        />
      </Campo>

      <div className="flex flex-wrap gap-4">
        <Campo id="f-tel" label="WhatsApp o teléfono" error={errors.telefono?.message} className="flex-1 basis-[180px]">
          <input
            id="f-tel"
            type="tel"
            autoComplete="tel"
            placeholder="+56 9"
            aria-invalid={Boolean(errors.telefono)}
            aria-describedby={errors.telefono ? "f-tel-error" : undefined}
            className={CLASE_INPUT}
            {...register("telefono")}
          />
        </Campo>
        <Campo id="f-tipo" label="Tipo de local" error={errors.tipo?.message} className="flex-1 basis-[180px]">
          <select id="f-tipo" className={`${CLASE_INPUT} bg-white`} {...register("tipo")}>
            {TIPOS_LOCAL_DIAGNOSTICO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo id="f-msg" label="¿Qué te preocupa hoy? (opcional)" error={errors.mensaje?.message}>
        <textarea
          id="f-msg"
          placeholder="Por ejemplo: me falta ordenar los registros de temperatura"
          aria-invalid={Boolean(errors.mensaje)}
          aria-describedby={errors.mensaje ? "f-msg-error" : undefined}
          className="min-h-24 rounded-[10px] border-2 border-[#C3CCD8] px-3.5 py-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341] aria-[invalid=true]:border-[#9A1C12]"
          {...register("mensaje")}
        />
      </Campo>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No completar este campo
          <input tabIndex={-1} autoComplete="off" {...register("sitio_web")} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pendiente}
        className="min-h-[52px] rounded-xl bg-[#2F6B2A] text-white font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341] disabled:opacity-60"
      >
        {pendiente ? "Enviando…" : "Quiero mi diagnóstico"}
      </button>

      {errorServidor && (
        <p role="alert" className="text-sm font-semibold text-[#9A1C12]">
          {errorServidor}
        </p>
      )}

      <p className="text-[13px] font-semibold leading-snug text-[#5B6980]">
        Usaremos tus datos solo para responderte, conforme a la Ley 21.719 de protección de datos personales.
      </p>
    </form>
  );
}

function Campo({
  id,
  label,
  error,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 text-sm font-bold ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[13px] font-semibold text-[#9A1C12]">
          {error}
        </p>
      )}
    </div>
  );
}
