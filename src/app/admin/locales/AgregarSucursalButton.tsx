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

interface Props {
  casaCentralId: string;
  casaCentralNombre: string;
  rut: string;
  planActual: string;
}

export function AgregarSucursalButton({
  casaCentralId,
  casaCentralNombre,
  rut,
  planActual,
}: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [plan, setPlan] = useState<"calidad" | "integral">(
    planActual === "integral" ? "integral" : "calidad"
  );
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
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#143556] font-medium hover:text-[#4B8B2E] transition-colors"
        title="Agregar sucursal de esta empresa"
      >
        <IconBuildingPlus size={14} />
        Sucursal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <IconBuildingPlus size={18} className="text-[#4B8B2E]" />
                <p className="font-semibold text-[#0B2545] text-sm">Agregar sucursal</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#64748B]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F8F9FA] rounded-xl p-3">
                <p className="text-xs text-[#64748B]">Casa central</p>
                <p className="text-sm font-semibold text-[#0B2545]">{casaCentralNombre}</p>
                <p className="text-xs text-[#64748B] mt-0.5">RUT {rut} (compartido)</p>
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
                  {(["calidad", "integral"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`rounded-xl border-2 p-2.5 text-sm font-medium capitalize transition-colors ${
                        plan === p
                          ? "border-[#4B8B2E] bg-[#EBF5E6] text-[#3A6E24]"
                          : "border-[#E2E8F0] text-[#64748B] hover:border-[#4B8B2E]/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {crear.error && (
                <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
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
                  className="flex-1 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
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
