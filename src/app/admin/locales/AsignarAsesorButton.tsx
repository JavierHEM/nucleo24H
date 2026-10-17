"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUserCheck,
  IconX,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Asesor {
  id: string;
  nombre: string;
  email: string;
}

interface Props {
  tenantId: string;
  tenantNombre: string;
  asesores: Asesor[];
  asesorActualId?: string | null;
}

export function AsignarAsesorButton({
  tenantId,
  tenantNombre,
  asesores,
  asesorActualId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedAsesorId, setSelectedAsesorId] = useState<string>(
    asesorActualId ?? ""
  );
  const router = useRouter();
  const utils = trpc.useUtils();

  const asignar = trpc.locales.asignarAsesor.useMutation({
    onSuccess: () => {
      utils.locales.list.invalidate();
      setOpen(false);
      router.refresh();
    },
  });

  async function handleSubmit() {
    if (!selectedAsesorId) return;
    await asignar.mutateAsync({
      tenant_id: tenantId,
      asesor_id: selectedAsesorId,
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#16294A] font-medium hover:text-[#2F6B2A] transition-colors"
      >
        <IconUserCheck size={14} />
        {asesorActualId ? "Cambiar asesor" : "Asignar asesor"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <div className="flex items-center gap-2">
                <IconUserCheck size={18} className="text-[#2F6B2A]" />
                <p className="font-semibold text-[#0B1B33] text-sm">Asignar asesor</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#5B6980]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F4F6F3] rounded-xl p-3">
                <p className="text-xs text-[#5B6980]">Local</p>
                <p className="text-sm font-semibold text-[#0B1B33]">{tenantNombre}</p>
              </div>

              <div>
                <Label className="block mb-2">Selecciona el asesor</Label>
                {asesores.length === 0 ? (
                  <p className="text-sm text-[#5B6980] text-center py-4">
                    No hay asesores registrados. Crea un asesor primero.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {asesores.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAsesorId(a.id)}
                        className={`w-full text-left rounded-xl border-2 p-3 transition-colors ${
                          selectedAsesorId === a.id
                            ? "border-[#2F6B2A] bg-[#E5F1E3]"
                            : "border-[#DDE3EA] hover:border-[#2F6B2A]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-[#0B1B33]">{a.nombre}</p>
                            <p className="text-xs text-[#5B6980]">{a.email}</p>
                          </div>
                          {selectedAsesorId === a.id && (
                            <IconCircleCheck size={18} className="text-[#2F6B2A] shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {asignar.error && (
                <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                  {asignar.error.message}
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
                  type="button"
                  disabled={!selectedAsesorId || asignar.isPending}
                  onClick={handleSubmit}
                  className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
                >
                  {asignar.isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconCircleCheck size={16} />
                  )}
                  {asignar.isPending ? "Asignando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
