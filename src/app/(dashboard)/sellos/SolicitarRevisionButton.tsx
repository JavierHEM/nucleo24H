"use client";

import { useState } from "react";
import { IconMessageQuestion, IconX, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

interface Props {
  selloId: string;
}

export function SolicitarRevisionButton({ selloId }: Props) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  const { mutate, isPending, error, isSuccess, reset } = trpc.sellos.solicitarRevision.useMutation({
    onSuccess: () => {
      setTimeout(() => {
        setOpen(false);
        setMotivo("");
        reset();
      }, 2000);
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#5B6980] hover:text-[#0B1B33] border border-[#DDE3EA] rounded-lg px-3 py-1.5 hover:bg-[#F4F6F3] transition-colors flex items-center gap-1.5"
      >
        <IconMessageQuestion size={14} />
        Solicitar revisión
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <div className="flex items-center gap-2">
                <IconMessageQuestion size={20} className="text-amber-500" />
                <p className="font-semibold text-[#0B1B33]">Solicitar revisión del sello</p>
              </div>
              <button onClick={() => { setOpen(false); setMotivo(""); reset(); }} className="text-[#5B6980] hover:text-[#0B1B33]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-[#5B6980]">
                Explica al asesor por qué consideras que el resultado del sello no refleja
                correctamente las condiciones del local.
              </p>
              <div>
                <label className="text-xs font-medium text-[#5B6980] block mb-1.5">
                  Motivo de la revisión <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Los documentos de limpieza estaban actualizados pero no fueron considerados..."
                  className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                />
                <p className="text-xs text-[#94A3B8] mt-1 text-right">{motivo.length}/10 mín.</p>
              </div>

              {error && (
                <p className="text-xs text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                  {error.message}
                </p>
              )}

              {isSuccess && (
                <p className="text-xs text-[#2F6B2A] bg-green-50 rounded-lg px-3 py-2 font-medium">
                  ✓ Solicitud enviada. Tu asesor la revisará pronto.
                </p>
              )}

              <Button
                disabled={motivo.trim().length < 10 || isPending || isSuccess}
                onClick={() => mutate({ sello_id: selloId, motivo: motivo.trim() })}
                className="w-full min-h-11 bg-amber-500 hover:bg-amber-600 text-white gap-2"
              >
                {isPending ? (
                  <IconLoader2 size={16} className="animate-spin" />
                ) : (
                  <IconMessageQuestion size={16} />
                )}
                {isSuccess ? "Solicitud enviada" : "Enviar solicitud de revisión"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
