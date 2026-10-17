"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconX, IconSend, IconChevronRight } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

type TipoDerecho =
  | "acceso"
  | "rectificacion"
  | "supresion"
  | "oposicion"
  | "portabilidad"
  | "bloqueo";

interface Props {
  tipo: TipoDerecho;
  label: string;
  desc: string;
}

export function SolicitarDerechoButton({ tipo, label, desc }: Props) {
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const { mutateAsync, isPending } = trpc.arsopb.solicitarDerecho.useMutation({
    onSuccess: () => {
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setDetalle("");
        router.refresh();
      }, 2000);
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 p-3 rounded-xl border border-[#DDE3EA] bg-[#F4F6F3] hover:bg-[#E5F1E3] hover:border-green-200 transition-colors text-left"
      >
        <div className="flex-1">
          <p className="text-sm font-medium text-[#0B1B33]">{label}</p>
          <p className="text-xs text-[#5B6980] mt-0.5">{desc}</p>
        </div>
        <IconChevronRight size={16} className="text-[#5B6980] shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <p className="font-semibold text-[#0B1B33]">Solicitud: {label}</p>
              <button onClick={() => setOpen(false)} className="text-[#5B6980]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {sent ? (
                <div className="text-center py-6">
                  <p className="text-[#2F6B2A] font-semibold">✅ Solicitud enviada</p>
                  <p className="text-sm text-[#5B6980] mt-2">
                    Tenemos 30 días para responderte, según la Ley 21.719.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#5B6980]">{desc}</p>

                  <div>
                    <label className="text-sm font-medium text-[#0B1B33] block mb-2">
                      Detalle adicional (opcional)
                    </label>
                    <textarea
                      value={detalle}
                      onChange={(e) => setDetalle(e.target.value)}
                      placeholder="Describe con más detalle tu solicitud..."
                      rows={3}
                      className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                    />
                  </div>

                  <div className="bg-[#E5F1E3] rounded-lg p-3 text-xs text-[#255620]">
                    El plazo de respuesta es de <strong>30 días corridos</strong> desde la recepción (Art. 6°, Ley 21.719).
                  </div>

                  <Button
                    onClick={() => mutateAsync({ tipo_derecho: tipo, detalle: detalle || undefined })}
                    disabled={isPending}
                    className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
                  >
                    <IconSend size={16} />
                    {isPending ? "Enviando..." : "Enviar solicitud"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
