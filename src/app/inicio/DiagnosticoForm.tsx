"use client";

import { useState } from "react";

const TIPOS = ["Restaurante", "Cafetería", "Cocinería", "Food truck", "Otro"] as const;

export function DiagnosticoForm() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nombre = String(data.get("nombre") ?? "").trim();
    const local = String(data.get("local") ?? "").trim();
    const telefono = String(data.get("telefono") ?? "").trim();
    if (!nombre || !local || !telefono) {
      setError("Completa tu nombre, el local y un teléfono.");
      setEnviado(false);
      return;
    }
    setError(null);
    setEnviado(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex-1 basis-[420px] bg-white text-[#0B1B33] rounded-[20px] p-8 flex flex-col gap-4"
      aria-label="Solicitar diagnóstico"
    >
      <h3 className="text-2xl font-extrabold">Cuéntanos de tu local</h3>
      <Campo id="f-nombre" name="nombre" label="Tu nombre" placeholder="Tu nombre" />
      <Campo id="f-local" name="local" label="Nombre del local" placeholder="Restaurante, cafetería o food truck" />
      <div className="flex flex-wrap gap-4">
        <Campo id="f-tel" name="telefono" label="WhatsApp o teléfono" placeholder="+56 9" type="tel" className="flex-1 basis-[180px]" />
        <label className="flex flex-1 basis-[180px] flex-col gap-1.5 text-sm font-bold">
          Tipo de local
          <select id="f-tipo" name="tipo" className="min-h-[52px] rounded-[10px] border-2 border-[#C3CCD8] px-3.5 text-base font-semibold bg-white">
            {TIPOS.map((tipo) => (
              <option key={tipo}>{tipo}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        ¿Qué te preocupa hoy? (opcional)
        <textarea
          id="f-msg"
          name="mensaje"
          placeholder="Por ejemplo: me falta ordenar los registros de temperatura"
          className="min-h-24 rounded-[10px] border-2 border-[#C3CCD8] px-3.5 py-3 text-base font-semibold"
        />
      </label>
      <button type="submit" className="min-h-[52px] rounded-xl bg-[#2F6B2A] text-white font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341]">
        Quiero mi diagnóstico
      </button>
      {error && <p className="text-sm font-semibold text-[#9A1C12]">{error}</p>}
      {enviado && (
        <p className="text-sm font-semibold text-[#7A5000]">
          TODO: conectar el envío a un correo o WhatsApp. Tus datos no salieron de esta pantalla.
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
  name,
  label,
  placeholder,
  type = "text",
  className = "",
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-bold ${className}`}>
      {label}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        className="min-h-[52px] rounded-[10px] border-2 border-[#C3CCD8] px-3.5 text-base font-semibold"
      />
    </label>
  );
}
