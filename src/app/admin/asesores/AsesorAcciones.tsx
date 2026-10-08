"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPencil, IconUserOff, IconUserCheck, IconX } from "@tabler/icons-react";

interface Props {
  id: string;
  nombre: string;
  activo: boolean;
}

export function AsesorAcciones({ id, nombre, activo }: Props) {
  const router = useRouter();
  const [modo, setModo] = useState<"editar" | "estado" | null>(null);
  const [nombreEdit, setNombreEdit] = useState(nombre);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function cerrar() {
    setModo(null);
    setNombreEdit(nombre);
    setError("");
  }

  async function guardar(body: { nombre?: string; activo?: boolean }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/asesores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar.");
        return;
      }
      cerrar();
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setNombreEdit(nombre);
            setModo("editar");
          }}
          className="text-xs font-medium text-[#143556] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 hover:bg-[#F8FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4B8B2E]"
        >
          <span className="inline-flex items-center gap-1">
            <IconPencil size={13} />
            Editar
          </span>
        </button>
        <button
          type="button"
          onClick={() => setModo("estado")}
          className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4B8B2E] ${
            activo
              ? "text-[#DC2626] border-[#FECACA] hover:bg-red-50"
              : "text-[#3A6E24] border-[#BBF7D0] hover:bg-[#EBF5E6]"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {activo ? <IconUserOff size={13} /> : <IconUserCheck size={13} />}
            {activo ? "Dar de baja" : "Reactivar"}
          </span>
        </button>
      </div>

      {modo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={cerrar} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="asesor-accion-titulo"
            className="relative bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-6 w-full max-w-md z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="asesor-accion-titulo" className="font-bold text-[#0B2545]">
                {modo === "editar" ? "Editar asesor" : activo ? "Dar de baja" : "Reactivar asesor"}
              </h2>
              <button type="button" onClick={cerrar} className="text-[#94A3B8] hover:text-[#64748B]">
                <IconX size={20} />
              </button>
            </div>

            {modo === "editar" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void guardar({ nombre: nombreEdit });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor={`nombre-${id}`} className="block text-sm font-medium text-[#334155] mb-1.5">
                    Nombre
                  </label>
                  <input
                    id={`nombre-${id}`}
                    value={nombreEdit}
                    onChange={(e) => setNombreEdit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0B2545] text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]/30 focus:border-[#4B8B2E]"
                  />
                </div>
                <p className="text-xs text-[#64748B]">
                  El correo es la cuenta de acceso y no se modifica desde aquí.
                </p>
                {error && <p className="text-xs text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cerrar}
                    className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || nombreEdit.trim().length < 2}
                    className="flex-1 py-2.5 rounded-xl bg-[#4B8B2E] text-white text-sm font-medium disabled:opacity-60"
                  >
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#334155]">
                  {activo
                    ? `${nombre} dejará de ingresar y se le quitarán los locales asignados.`
                    : `${nombre} podrá ingresar de nuevo. Los locales hay que volver a asignarlos.`}
                </p>
                {error && <p className="text-xs text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cerrar}
                    className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void guardar({ activo: !activo })}
                    className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 ${
                      activo ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#4B8B2E] hover:bg-[#3A6E24]"
                    }`}
                  >
                    {loading ? "Guardando..." : activo ? "Dar de baja" : "Reactivar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
