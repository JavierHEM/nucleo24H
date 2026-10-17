"use client";

import { useState } from "react";
import {
  IconClipboardCheck,
  IconX,
  IconLoader2,
  IconCircleCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EstadoRevision = "aprobado" | "observado" | "rechazado";

const OPCIONES: Array<{
  value: EstadoRevision;
  label: string;
  icon: typeof IconCircleCheck;
  className: string;
  activeClass: string;
}> = [
  {
    value: "aprobado",
    label: "Aprobado",
    icon: IconCircleCheck,
    className: "border-[#DDE3EA] text-[#5B6980] hover:border-green-400 hover:text-green-700",
    activeClass: "border-green-400 bg-green-50 text-green-700",
  },
  {
    value: "observado",
    label: "Con observación",
    icon: IconAlertTriangle,
    className: "border-[#DDE3EA] text-[#5B6980] hover:border-orange-400 hover:text-orange-700",
    activeClass: "border-orange-400 bg-orange-50 text-orange-700",
  },
  {
    value: "rechazado",
    label: "Rechazado",
    icon: IconX,
    className: "border-[#DDE3EA] text-[#5B6980] hover:border-red-400 hover:text-red-700",
    activeClass: "border-red-400 bg-red-50 text-red-700",
  },
];

interface Props {
  docId: string;
  docNombre: string;
  estadoActual: string;
}

export function RevisarDocumentoButton({ docId, docNombre, estadoActual }: Props) {
  const [open, setOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoRevision | null>(null);
  const [observacion, setObservacion] = useState("");
  const utils = trpc.useUtils();

  const revisar = trpc.documentos.revisar.useMutation({
    onSuccess: () => {
      utils.documentos.list.invalidate();
      setTimeout(() => {
        setOpen(false);
        setNuevoEstado(null);
        setObservacion("");
      }, 800);
    },
  });

  const needsObservacion = nuevoEstado === "observado" || nuevoEstado === "rechazado";
  const canSubmit =
    nuevoEstado !== null &&
    (!needsObservacion || observacion.trim().length >= 5) &&
    !revisar.isPending;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-[#16294A] hover:text-[#2F6B2A] border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 hover:bg-[#E5F1E3] transition-colors"
        title="Revisar documento"
      >
        <IconClipboardCheck size={13} />
        Revisar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <div className="flex items-center gap-2">
                <IconClipboardCheck size={20} className="text-[#2F6B2A]" />
                <p className="font-semibold text-[#0B1B33]">Revisar documento</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#5B6980] hover:text-[#0B1B33]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Nombre del doc */}
              <div className="bg-[#F4F6F3] rounded-xl px-4 py-3">
                <p className="text-xs text-[#5B6980] mb-0.5">Documento</p>
                <p className="text-sm font-medium text-[#0B1B33] truncate">{docNombre}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5 capitalize">
                  Estado actual: {estadoActual}
                </p>
              </div>

              {/* Selector de estado */}
              <div>
                <p className="text-xs font-medium text-[#5B6980] mb-2">Resultado de la revisión</p>
                <div className="grid grid-cols-3 gap-2">
                  {OPCIONES.map((op) => {
                    const Icon = op.icon;
                    const isSelected = nuevoEstado === op.value;
                    return (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => setNuevoEstado(op.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium",
                          isSelected ? op.activeClass : op.className
                        )}
                      >
                        <Icon size={20} />
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observación — requerida si observado/rechazado, opcional si aprobado */}
              <div>
                <label className="text-xs font-medium text-[#5B6980] block mb-1.5">
                  {needsObservacion ? (
                    <span>Motivo <span className="text-red-500">*</span></span>
                  ) : (
                    <span>Comentario <span className="text-[#94A3B8]">(opcional)</span></span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder={
                    needsObservacion
                      ? "Explica qué debe corregirse..."
                      : "Comentario para el local..."
                  }
                  className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                />
                {needsObservacion && observacion.trim().length < 5 && observacion.length > 0 && (
                  <p className="text-xs text-[#B42318] mt-1">Mínimo 5 caracteres.</p>
                )}
              </div>

              {revisar.error && (
                <p className="text-xs text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                  {revisar.error.message}
                </p>
              )}

              {revisar.isSuccess && (
                <p className="text-xs text-[#2F6B2A] bg-green-50 rounded-lg px-3 py-2 font-medium">
                  ✓ Revisión guardada correctamente.
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!canSubmit}
                  onClick={() =>
                    revisar.mutate({
                      id: docId,
                      estado: nuevoEstado!,
                      observacion: observacion.trim() || undefined,
                    })
                  }
                  className="flex-1 bg-[#16294A] hover:bg-[#0B1B33] text-white gap-2"
                >
                  {revisar.isPending ? (
                    <IconLoader2 size={15} className="animate-spin" />
                  ) : (
                    <IconClipboardCheck size={15} />
                  )}
                  Guardar revisión
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
