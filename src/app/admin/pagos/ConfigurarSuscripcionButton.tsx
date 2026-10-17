"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconSettings,
  IconX,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCLP } from "@/lib/utils";

const PRECIOS_PLAN: Record<"calidad" | "integral", number> = {
  calidad: 80_000,
  integral: 150_000,
};

const ESTADOS = ["activa", "morosa", "suspendida", "cancelada"] as const;

interface Suscripcion {
  id: string;
  plan: string;
  monto_clp: number;
  estado: string;
  dia_cobro: number;
}

interface Props {
  tenantId: string;
  tenantNombre: string;
  suscripcion: Suscripcion | null;
  planTenant: string;
}

export function ConfigurarSuscripcionButton({
  tenantId,
  tenantNombre,
  suscripcion,
  planTenant,
}: Props) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"calidad" | "integral">(
    (suscripcion?.plan ?? planTenant) === "integral" ? "integral" : "calidad"
  );
  const [monto, setMonto] = useState(
    String(suscripcion?.monto_clp ?? PRECIOS_PLAN[planTenant === "integral" ? "integral" : "calidad"])
  );
  const [diaCobro, setDiaCobro] = useState(String(suscripcion?.dia_cobro ?? 5));
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]>(
    (ESTADOS.find((e) => e === suscripcion?.estado) ?? "activa")
  );
  const router = useRouter();
  const utils = trpc.useUtils();

  const configurar = trpc.pagos.configurarSuscripcion.useMutation({
    onSuccess: () => {
      utils.pagos.adminResumen.invalidate();
      setOpen(false);
      router.refresh();
    },
  });

  const montoNum = Number(monto);
  const diaNum = Number(diaCobro);
  const valido =
    Number.isInteger(montoNum) && montoNum > 0 && diaNum >= 1 && diaNum <= 28;

  function selectPlan(nuevo: "calidad" | "integral") {
    setPlan(nuevo);
    setMonto(String(PRECIOS_PLAN[nuevo]));
  }

  function handleSubmit() {
    if (!valido) return;
    configurar.mutate({
      tenant_id: tenantId,
      plan,
      monto_clp: montoNum,
      dia_cobro: diaNum,
      estado,
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#16294A] font-medium hover:text-[#2F6B2A] transition-colors"
      >
        <IconSettings size={14} />
        Suscripción
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <div className="flex items-center gap-2">
                <IconSettings size={18} className="text-[#2F6B2A]" />
                <p className="font-semibold text-[#0B1B33] text-sm">
                  Configurar suscripción
                </p>
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
                <Label className="block mb-2">Plan</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["calidad", "integral"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => selectPlan(p)}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${
                        plan === p
                          ? "border-[#2F6B2A] bg-[#E5F1E3]"
                          : "border-[#DDE3EA] hover:border-[#2F6B2A]/50"
                      }`}
                    >
                      <p className="font-medium text-sm text-[#0B1B33] capitalize">{p}</p>
                      <p className="text-xs text-[#5B6980]">
                        {formatCLP(PRECIOS_PLAN[p])}/mes
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="monto-sus" className="block mb-2">
                    Monto (CLP)
                  </Label>
                  <Input
                    id="monto-sus"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="min-h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="dia-cobro" className="block mb-2">
                    Día de cobro
                  </Label>
                  <Input
                    id="dia-cobro"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={28}
                    value={diaCobro}
                    onChange={(e) => setDiaCobro(e.target.value)}
                    className="min-h-12"
                  />
                </div>
              </div>

              <div>
                <Label className="block mb-2">Estado</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ESTADOS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEstado(e)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                        estado === e
                          ? "border-[#2F6B2A] bg-[#E5F1E3] text-[#255620]"
                          : "border-[#DDE3EA] text-[#5B6980] hover:border-[#2F6B2A]/50"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {configurar.error && (
                <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                  {configurar.error.message}
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
                  disabled={!valido || configurar.isPending}
                  onClick={handleSubmit}
                  className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
                >
                  {configurar.isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconCircleCheck size={16} />
                  )}
                  {configurar.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
