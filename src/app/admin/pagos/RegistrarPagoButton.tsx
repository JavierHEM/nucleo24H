"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCashBanknote,
  IconX,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCLP, formatPeriodo } from "@/lib/utils";

interface Props {
  tenantId: string;
  tenantNombre: string;
  periodo: string;
  montoSugerido: number;
}

export function RegistrarPagoButton({
  tenantId,
  tenantNombre,
  periodo,
  montoSugerido,
}: Props) {
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState(String(montoSugerido));
  const [observacion, setObservacion] = useState("");
  const router = useRouter();
  const utils = trpc.useUtils();

  const registrar = trpc.pagos.registrarPagoManual.useMutation({
    onSuccess: () => {
      utils.pagos.adminResumen.invalidate();
      setOpen(false);
      router.refresh();
    },
  });

  const montoNum = Number(monto);
  const montoValido = Number.isInteger(montoNum) && montoNum > 0;

  function handleSubmit() {
    if (!montoValido) return;
    registrar.mutate({
      tenant_id: tenantId,
      periodo,
      monto_clp: montoNum,
      observacion: observacion.trim() || undefined,
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#3A6E24] font-medium hover:text-[#4B8B2E] transition-colors"
      >
        <IconCashBanknote size={14} />
        Registrar pago
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <IconCashBanknote size={18} className="text-[#4B8B2E]" />
                <p className="font-semibold text-[#0B2545] text-sm">
                  Registrar pago por transferencia
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#64748B]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F8F9FA] rounded-xl p-3">
                <p className="text-xs text-[#64748B]">Local</p>
                <p className="text-sm font-semibold text-[#0B2545]">{tenantNombre}</p>
                <p className="text-xs text-[#64748B] mt-1 capitalize">
                  Período: {formatPeriodo(periodo)}
                </p>
              </div>

              <div>
                <Label htmlFor="monto" className="block mb-2">
                  Monto (CLP)
                </Label>
                <Input
                  id="monto"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="min-h-12"
                />
                {montoValido && (
                  <p className="text-xs text-[#64748B] mt-1">{formatCLP(montoNum)}</p>
                )}
              </div>

              <div>
                <Label htmlFor="observacion" className="block mb-2">
                  Observación (opcional)
                </Label>
                <Input
                  id="observacion"
                  type="text"
                  placeholder="N° de comprobante, banco, etc."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  maxLength={500}
                  className="min-h-12"
                />
              </div>

              {registrar.error && (
                <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
                  {registrar.error.message}
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
                  disabled={!montoValido || registrar.isPending}
                  onClick={handleSubmit}
                  className="flex-1 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
                >
                  {registrar.isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconCircleCheck size={16} />
                  )}
                  {registrar.isPending ? "Registrando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
