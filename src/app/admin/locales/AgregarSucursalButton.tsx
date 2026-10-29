"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBuildingPlus,
  IconX,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAN_IDS, PLANES, TIPOS_LOCAL, TIPO_LOCAL_LABEL, normalizarPlan, normalizarTipoLocal, type PlanId, type TipoLocal } from "@/lib/planes";

interface Props {
  casaCentralId: string;
  casaCentralNombre: string;
  rut: string;
  planActual: string;
  tipoLocalActual: string;
}

export function AgregarSucursalButton({
  casaCentralId,
  casaCentralNombre,
  rut,
  planActual,
  tipoLocalActual,
}: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [plan, setPlan] = useState<PlanId>(normalizarPlan(planActual));
  const [tipoLocal, setTipoLocal] = useState<TipoLocal>(normalizarTipoLocal(tipoLocalActual));
  const router = useRouter();
  const utils = trpc.useUtils();

  const crear = trpc.locales.crearSucursal.useMutation({
    onSuccess: () => {
      utils.locales.list.invalidate();
      setOpen(false);
      setNombre("");
      setDireccion("");
      router.refresh();
    },
  });

  async function handleSubmit() {
    if (nombre.trim().length < 2 || direccion.trim().length < 3) return;
    await crear.mutateAsync({
      casa_central_id: casaCentralId,
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      plan,
      tipo_local: tipoLocal,
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#16294A] font-medium hover:text-[#2F6B2A] transition-colors"
        title="Agregar sucursal de esta empresa"
      >
        <IconBuildingPlus size={14} />
        Sucursal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <div className="flex items-center gap-2">
                <IconBuildingPlus size={18} className="text-[#2F6B2A]" />
                <p className="font-semibold text-[#0B1B33] text-sm">Agregar sucursal</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#5B6980]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F4F6F3] rounded-xl p-3">
                <p className="text-xs text-[#5B6980]">Casa central</p>
                <p className="text-sm font-semibold text-[#0B1B33]">{casaCentralNombre}</p>
                <p className="text-xs text-[#5B6980] mt-0.5">RUT {rut} (compartido)</p>
              </div>

              <div>
                <Label htmlFor="nombre-sucursal" className="block mb-1.5">
                  Nombre de la sucursal
                </Label>
                <Input
                  id="nombre-sucursal"
                  placeholder="Ej: Sucursal Puerto Montt"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="direccion-sucursal" className="block mb-1.5">
                  Dirección
                </Label>
                <Input
                  id="direccion-sucursal"
                  placeholder="Calle y número"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>

              <div>
                <Label className="block mb-1.5">Plan</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_IDS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`rounded-xl border-2 p-2.5 text-sm font-medium capitalize transition-colors ${
                        plan === p
                          ? "border-[#2F6B2A] bg-[#E5F1E3] text-[#255620]"
                          : "border-[#DDE3EA] text-[#5B6980] hover:border-[#2F6B2A]/50"
                      }`}
                    >
                      {PLANES[p].nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="tipo-local-sucursal" className="block mb-1.5">
                  Tipo de local
                </Label>
                <select
                  id="tipo-local-sucursal"
                  value={tipoLocal}
                  onChange={(e) => setTipoLocal(normalizarTipoLocal(e.target.value))}
                  className="flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                >
                  {TIPOS_LOCAL.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_LOCAL_LABEL[tipo]}
                    </option>
                  ))}
                </select>
              </div>

              {crear.error && (
                <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">
                  {crear.error.message}
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
                  disabled={
                    nombre.trim().length < 2 ||
                    direccion.trim().length < 3 ||
                    crear.isPending
                  }
                  onClick={handleSubmit}
                  className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
                >
                  {crear.isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconCircleCheck size={16} />
                  )}
                  {crear.isPending ? "Creando..." : "Crear sucursal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
