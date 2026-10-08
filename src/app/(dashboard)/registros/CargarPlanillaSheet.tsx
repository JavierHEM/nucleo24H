"use client";

import { useRef, useState } from "react";
import { IconUpload, IconChevronLeft, IconX, IconLoader2, IconCircleCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { FAMILIAS, planillasDe, type FamiliaId, type Planilla } from "@/lib/bpm/planillas";

const TIPOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

type Archivo =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "done"; url: string; filename: string }
  | { status: "error"; message: string };

export function CargarPlanillaSheet() {
  const [open, setOpen] = useState(false);
  const [familia, setFamilia] = useState<FamiliaId | null>(null);
  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState("");
  const [archivo, setArchivo] = useState<Archivo>({ status: "idle" });
  const [aviso, setAviso] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const cargar = trpc.registros.cargarPapel.useMutation({
    onSuccess: (resultado) => {
      utils.registros.list.invalidate();
      setAviso(
        resultado.asesoresNotificados > 0
          ? "Planilla cargada. Avisamos al asesor del local para que la revise."
          : "Planilla cargada. Este local no tiene un asesor asignado, así que nadie fue notificado."
      );
    },
  });

  function cerrar() {
    setOpen(false);
    setFamilia(null);
    setPlanilla(null);
    setNota("");
    setArchivo({ status: "idle" });
    setAviso(null);
  }

  function volver() {
    if (planilla) {
      setPlanilla(null);
      return;
    }
    setFamilia(null);
  }

  async function elegirArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!TIPOS.includes(file.type)) {
      setArchivo({ status: "error", message: "Sube una foto (JPG, PNG o WebP) o un PDF." });
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 10) {
      setArchivo({ status: "error", message: "El archivo no puede superar 10 MB." });
      return;
    }

    setArchivo({ status: "uploading", progress: 0 });
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeMb,
          bucket: "registros",
        }),
      });
      const json = (await res.json()) as { uploadUrl?: string; ruta?: string; error?: string };
      if (!res.ok || !json.uploadUrl || !json.ruta) {
        setArchivo({ status: "error", message: json.error ?? "No se pudo preparar la carga." });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setArchivo({ status: "uploading", progress: Math.round((ev.loaded / ev.total) * 100) });
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("falló")));
        xhr.onerror = () => reject(new Error("red"));
        xhr.open("PUT", json.uploadUrl!);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setArchivo({ status: "done", url: json.ruta, filename: file.name });
    } catch {
      setArchivo({ status: "error", message: "No se pudo subir el archivo. Intenta de nuevo." });
    }
  }

  async function guardar() {
    if (!planilla || archivo.status !== "done" || !fecha) return;
    const instante = new Date(`${fecha}T12:00:00`);
    await cargar.mutateAsync({
      codigo: planilla.codigo,
      fecha: instante.toISOString(),
      adjunto_url: archivo.url,
      nota: nota.trim() || undefined,
    });
  }

  const titulo = planilla
    ? planilla.nombre
    : familia
      ? FAMILIAS.find((item) => item.id === familia)?.label
      : "Cargar planilla impresa";

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2 border-[#E2E8F0] text-[#143556]"
        size="sm"
      >
        <IconUpload size={16} />
        Cargar planilla
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 min-w-0">
                {(familia || planilla) && !aviso && (
                  <button
                    type="button"
                    onClick={volver}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F8F9FA] text-[#64748B]"
                    aria-label="Volver"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                )}
                <p className="font-semibold text-[#0B2545] text-sm truncate">{titulo}</p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F8F9FA] text-[#64748B]"
                aria-label="Cerrar"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-5">
              {aviso ? (
                <div className="text-center py-8">
                  <IconCircleCheck size={28} className="mx-auto text-[#4B8B2E] mb-3" />
                  <p className="text-sm text-[#0B2545]">{aviso}</p>
                  <Button onClick={cerrar} className="mt-6 bg-[#143556] text-white">
                    Cerrar
                  </Button>
                </div>
              ) : !familia ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#64748B]">
                    Elige la planilla que imprimiste. El asesor del local recibirá el archivo para revisarlo.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FAMILIAS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFamilia(item.id)}
                        className="text-left p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#4B8B2E] hover:bg-[#EBF5E6]/40"
                      >
                        <p className="font-mono text-[11px] text-[#64748B]">{item.procedimiento}</p>
                        <p className="font-semibold text-sm text-[#0B2545] mt-1">{item.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : !planilla ? (
                <div className="space-y-2">
                  {planillasDe(familia).map((item) => (
                    <button
                      key={item.codigo}
                      type="button"
                      onClick={() => setPlanilla(item)}
                      className="w-full text-left p-4 rounded-xl border border-[#E2E8F0] hover:border-[#4B8B2E]"
                    >
                      <p className="font-mono text-[11px] text-[#64748B]">{item.codigo}</p>
                      <p className="font-medium text-sm text-[#0B2545] mt-0.5">{item.nombre}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-mono text-xs text-[#64748B]">{planilla.codigo}</p>
                  <div>
                    <Label htmlFor="fecha-planilla">Fecha de la planilla</Label>
                    <Input
                      id="fecha-planilla"
                      type="date"
                      value={fecha}
                      onChange={(event) => setFecha(event.target.value)}
                      className="mt-1 min-h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="archivo-planilla">Foto o PDF</Label>
                    <input
                      id="archivo-planilla"
                      ref={fileRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="mt-1 block w-full text-sm text-[#334155]"
                      onChange={elegirArchivo}
                    />
                    {archivo.status === "uploading" && (
                      <p className="text-xs text-[#64748B] mt-2 inline-flex items-center gap-1">
                        <IconLoader2 size={14} className="animate-spin" />
                        Subiendo... {archivo.progress}%
                      </p>
                    )}
                    {archivo.status === "done" && (
                      <p className="text-xs text-[#3A6E24] mt-2">{archivo.filename}</p>
                    )}
                    {archivo.status === "error" && (
                      <p className="text-xs text-[#DC2626] mt-2">{archivo.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nota-planilla">Nota (opcional)</Label>
                    <textarea
                      id="nota-planilla"
                      value={nota}
                      onChange={(event) => setNota(event.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
                    />
                  </div>
                  {cargar.error && (
                    <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">{cargar.error.message}</p>
                  )}
                  <Button
                    type="button"
                    onClick={() => void guardar()}
                    disabled={archivo.status !== "done" || !fecha || cargar.isPending}
                    className="w-full min-h-12 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white"
                  >
                    {cargar.isPending ? "Guardando..." : "Enviar al asesor"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
