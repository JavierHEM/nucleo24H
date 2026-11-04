"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { ArchivosAdjuntos, type ArchivoSubido } from "@/components/ui/ArchivosAdjuntos";
import { GRAVEDADES, ETIQUETA_GRAVEDAD, type GravedadHallazgo } from "@/lib/hallazgos/ciclo";

const AYUDA_GRAVEDAD: Record<GravedadHallazgo, string> = {
  critico: "Peligro inmediato de inocuidad. Bloquea el sello mientras esté abierto.",
  mayor: "Incumplimiento relevante o reiterado. Requiere plan y plazo.",
  menor: "Desviación aislada, sin peligro inmediato.",
};

const CAMPO =
  "w-full min-h-12 rounded-xl border border-[#DDE3EA] bg-white px-3 text-base sm:text-sm text-[#0B1B33] focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]/40";

export function CrearHallazgoButton() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-white text-sm font-medium shrink-0"
      >
        Registrar hallazgo
      </button>
      {abierto && <RegistrarHallazgoSheet onCerrar={() => setAbierto(false)} />}
    </>
  );
}

function RegistrarHallazgoSheet({ onCerrar }: { onCerrar: () => void }) {
  const tituloId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;
  const [descripcion, setDescripcion] = useState("");
  const [fundamento, setFundamento] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [plazo, setPlazo] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [fotos, setFotos] = useState<ArchivoSubido[]>([]);
  const [gravedad, setGravedad] = useState<GravedadHallazgo>("mayor");
  const router = useRouter();
  const proveedores = trpc.proveedores.list.useQuery();
  const crear = trpc.hallazgos.crear.useMutation({
    onSuccess: (hallazgo) => {
      onCerrar();
      router.push(`/hallazgos/${hallazgo.id}`);
      router.refresh();
    },
  });

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrarRef.current();
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", alTeclear);
      anterior?.focus();
    };
  }, []);

  function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    crear.mutate({
      descripcion,
      gravedad,
      fundamento: fundamento || undefined,
      ubicacion: ubicacion || undefined,
      plazo: plazo ? new Date(`${plazo}T12:00:00`).toISOString() : undefined,
      proveedor_id: proveedorId || undefined,
      fotos_iniciales: fotos.map((foto) => foto.ruta),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className="relative z-10 flex w-full max-w-3xl flex-col bg-white rounded-t-2xl sm:rounded-2xl sm:mx-4 max-h-[88dvh] focus:outline-none shadow-2xl"
      >
        <div className="sm:hidden flex justify-center pt-2" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-[#DDE3EA]" />
        </div>
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#DDE3EA] shrink-0">
          <div className="min-w-0">
            <h2 id={tituloId} className="text-lg sm:text-xl font-bold text-[#0B1B33]">
              Registrar hallazgo
            </h2>
            <p className="text-sm text-[#5B6980] mt-0.5">
              Describe lo observado, adjunta fotos y define gravedad y plazo.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-[#F4F6F3] text-[#5B6980] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
            aria-label="Cerrar"
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <fieldset>
                  <legend className="text-sm font-medium text-[#0B1B33]">Gravedad</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {GRAVEDADES.map((valor) => {
                      const activo = gravedad === valor;
                      return (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => setGravedad(valor)}
                          aria-pressed={activo}
                          className={`min-h-12 rounded-xl border px-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
                            activo
                              ? "border-[#16294A] bg-[#16294A] text-white"
                              : "border-[#DDE3EA] bg-white text-[#0B1B33]"
                          }`}
                        >
                          {ETIQUETA_GRAVEDAD[valor]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-[#5B6980]">{AYUDA_GRAVEDAD[gravedad]}</p>
                </fieldset>

                <label className="block">
                  <span className="text-sm font-medium text-[#0B1B33]">Qué observaste</span>
                  <textarea
                    required
                    minLength={8}
                    value={descripcion}
                    onChange={(evento) => setDescripcion(evento.target.value)}
                    className={`${CAMPO} mt-1 min-h-20 py-3`}
                    rows={3}
                    placeholder="Describe el hallazgo, el riesgo y dónde se vio."
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[#0B1B33]">Ubicación</span>
                    <input
                      value={ubicacion}
                      onChange={(evento) => setUbicacion(evento.target.value)}
                      className={`${CAMPO} mt-1`}
                      placeholder="Cámara, bodega, zona sucia…"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[#0B1B33]">Plazo de corrección</span>
                    <input
                      type="date"
                      value={plazo}
                      onChange={(evento) => setPlazo(evento.target.value)}
                      className={`${CAMPO} mt-1`}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-[#0B1B33]">Fundamento</span>
                  <textarea
                    value={fundamento}
                    onChange={(evento) => setFundamento(evento.target.value)}
                    className={`${CAMPO} mt-1 py-3`}
                    rows={2}
                    placeholder="Norma, pauta o criterio (opcional)"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#0B1B33]">Proveedor vinculado</span>
                  <select
                    value={proveedorId}
                    onChange={(evento) => setProveedorId(evento.target.value)}
                    className={`${CAMPO} mt-1`}
                  >
                    <option value="">Sin proveedor</option>
                    {(proveedores.data ?? []).map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.razon_social} · {proveedor.tipo_servicio}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[#0B1B33]">Fotos iniciales</p>
                <p className="text-xs text-[#5B6980]">Hasta 8. En el celular puedes usar la cámara o la galería.</p>
                <ArchivosAdjuntos
                  bucket="hallazgos"
                  valor={fotos}
                  onCambio={setFotos}
                  maximo={8}
                  etiqueta={fotos.length === 0 ? "Tomar o subir foto" : "Agregar otra foto"}
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  variante="fotos"
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#DDE3EA] bg-white px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {crear.error && <p className="mb-2 text-sm text-[#B42318]">{crear.error.message}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={onCerrar}
                className="min-h-12 px-4 rounded-lg border border-[#DDE3EA] text-sm font-medium text-[#16294A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={crear.isPending}
                className="min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-white text-sm font-medium disabled:opacity-60"
              >
                {crear.isPending ? "Guardando…" : "Guardar hallazgo"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
