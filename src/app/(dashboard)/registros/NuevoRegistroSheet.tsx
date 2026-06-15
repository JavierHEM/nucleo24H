"use client";

import { useState } from "react";
import {
  IconPlus,
  IconTemperature,
  IconDroplets,
  IconBug,
  IconChevronLeft,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FormTemperatura } from "@/components/registros/FormTemperatura";
import { FormLimpieza } from "@/components/registros/FormLimpieza";
import { FormPlagas } from "@/components/registros/FormPlagas";

type TipoActivo = "temperatura" | "limpieza" | "plagas" | null;

const TIPOS: {
  id: TipoActivo & NonNullable<TipoActivo>;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}[] = [
  {
    id: "temperatura",
    label: "Temperatura",
    desc: "Control de cadena de frío",
    icon: IconTemperature,
    color: "text-blue-600",
  },
  {
    id: "limpieza",
    label: "Limpieza",
    desc: "Sanitización y desinfección",
    icon: IconDroplets,
    color: "text-[#3D7A35]",
  },
  {
    id: "plagas",
    label: "Control plagas",
    desc: "Fumigación y monitoreo",
    icon: IconBug,
    color: "text-amber-600",
  },
];

export function NuevoRegistroSheet() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoActivo>(null);

  function handleClose() {
    setOpen(false);
    setTipo(null);
  }

  const titulo =
    tipo === "temperatura"
      ? "Control de temperatura"
      : tipo === "limpieza"
      ? "Registro de limpieza"
      : tipo === "plagas"
      ? "Control de plagas"
      : "¿Qué tipo de registro?";

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#3D7A35] hover:bg-[#2D5A27] text-white gap-2"
        size="sm"
      >
        <IconPlus size={16} />
        Nuevo registro
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

          <div className="relative z-10 w-full max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                {tipo && (
                  <button
                    onClick={() => setTipo(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F6F8] text-[#64748B]"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                )}
                <p className="font-semibold text-[#0D1F3C] text-sm">{titulo}</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F6F8] text-[#64748B]"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Selector de tipo */}
              {!tipo && (
                <div className="grid grid-cols-1 gap-3">
                  {TIPOS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTipo(t.id)}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#3D7A35] hover:bg-[#EAF3E0]/30 transition-colors text-left"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#F5F6F8] flex items-center justify-center shrink-0">
                        <t.icon size={22} className={t.color} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0D1F3C] text-sm">{t.label}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {tipo === "temperatura" && (
                <FormTemperatura onSuccess={handleClose} />
              )}
              {tipo === "limpieza" && (
                <FormLimpieza onSuccess={handleClose} />
              )}
              {tipo === "plagas" && (
                <FormPlagas onSuccess={handleClose} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
