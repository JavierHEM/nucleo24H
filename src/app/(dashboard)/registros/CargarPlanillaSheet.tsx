"use client";

import { useRef, useState } from "react";
import { IconUpload, IconChevronLeft, IconX, IconLoader2, IconCircleCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { FAMILIAS, getPlanilla, planillasDe, type FamiliaId, type Planilla } from "@/lib/bpm/planillas";

const TIPOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

type Archivo =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "done"; url: string; filename: string }
  | { status: "error"; message: string };

export function CargarPlanillaSheet({
  codigo,
  abierto = false,
  onCerrar,
}: {
  codigo?: string;
  abierto?: boolean;
  onCerrar?: () => void;
} = {}) {
  const controlado = onCerrar !== undefined;
  const fija = Boolean(codigo);
  const [openInterno, setOpenInterno] = useState(false);
  const open = controlado ? abierto : openInterno;
  const inicial = codigo ? (getPlanilla(codigo) ?? null) : null;
  const [familia, setFamilia] = useState<FamiliaId | null>(inicial?.familia ?? null);
  const [planilla, setPlanilla] = useState<Planilla | null>(inicial);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState("");
  const [archivo, setArchivo] = useState<Archivo>({ status: "idle" });
  const [aviso, setAviso] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const [codigoPrevio, setCodigoPrevio] = useState(codigo);
  if (codigo !== codigoPrevio) {
    setCodigoPrevio(codigo);
    if (codigo) {
      const encontrada = getPlanilla(codigo) ?? null;
      setPlanilla(encontrada);
      setFamilia(encontrada?.familia ?? null);
      setNota("");
      setArchivo({ status: "idle" });
      setAviso(null);
    }
  }
  const programa = trpc.programa.actual.useQuery(undefined, { enabled: open });
  const codigos = new Set((programa.data ?? []).filter((item) => item.activa).map((item) => item.codigo));
  const familias = FAMILIAS.filter((item) => planillasDe(item.id).some((planilla) => codigos.has(planilla.codigo)));

  const cargar = trpc.registros.cargarPapel.useMutation({
    onSuccess: (resultado) => {
      utils.registros.list.invalidate();
      utils.programa.agenda.invalidate();
      setAviso(
        resultado.asesoresNotificados > 0
          ? "Planilla cargada. Avisamos al asesor del local para que la revise."
          : "Planilla cargada. Este local no tiene un asesor asignado, así que nadie fue notificado."
      );
    },
  });

  function cerrar() {
    setOpenInterno(false);
    if (!fija) {
      setFamilia(null);
      setPlanilla(null);
    }
    setNota("");
    setArchivo({ status: "idle" });
    setAviso(null);
    onCerrar?.();
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
      {!controlado && (
        <Button
          onClick={() => setOpenInterno(true)}
          variant="outline"
          className="gap-2 border-[#DDE3EA] text-[#16294A]"
          size="sm"
        >
          <IconUpload size={16} />
          Cargar planilla
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={cerrar} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EA] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 min-w-0">
                {(familia || planilla) && !aviso && !fija && (
                  <button
                    type="button"
                    onClick={volver}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F6F3] text-[#5B6980]"
                    aria-label="Volver"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                )}
                <p className="font-semibold text-[#0B1B33] text-sm truncate">{titulo}</p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F6F3] text-[#5B6980]"
                aria-label="Cerrar"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-5">
              {aviso ? (
                <div className="text-center py-8">
                  <IconCircleCheck size={28} className="mx-auto text-[#2F6B2A] mb-3" />
                  <p className="text-sm text-[#0B1B33]">{aviso}</p>
                  <Button onClick={cerrar} className="mt-6 bg-[#16294A] text-white">
                    Cerrar
                  </Button>
                </div>
              ) : !familia ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#5B6980]">
                    Elige la planilla que imprimiste. El asesor del local recibirá el archivo para revisarlo.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {programa.isLoading && <p className="text-sm text-[#5B6980]">Cargando planillas…</p>}
                    {programa.data && familias.length === 0 && (
                      <p className="text-sm text-[#5B6980]">Este local no tiene planillas activas.</p>
                    )}
                    {familias.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFamilia(item.id)}
                        className="text-left p-4 rounded-xl border-2 border-[#DDE3EA] hover:border-[#2F6B2A] hover:bg-[#E5F1E3]/40"
                      >
                        <p className="font-mono text-[11px] text-[#5B6980]">{item.procedimiento}</p>
                        <p className="font-semibold text-sm text-[#0B1B33] mt-1">{item.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : !planilla ? (
                <div className="space-y-2">
                  {planillasDe(familia)
                    .filter((item) => codigos.has(item.codigo))
                    .map((item) => (
                    <button
                      key={item.codigo}
                      type="button"
                      onClick={() => setPlanilla(item)}
                      className="w-full text-left p-4 rounded-xl border border-[#DDE3EA] hover:border-[#2F6B2A]"
                    >
                      <p className="font-mono text-[11px] text-[#5B6980]">{item.codigo}</p>
                      <p className="font-medium text-sm text-[#0B1B33] mt-0.5">{item.nombre}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-mono text-xs text-[#5B6980]">{planilla.codigo}</p>
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
                      <p className="text-xs text-[#5B6980] mt-2 inline-flex items-center gap-1">
                        <IconLoader2 size={14} className="animate-spin" />
                        Subiendo... {archivo.progress}%
                      </p>
                    )}
                    {archivo.status === "done" && (
                      <p className="text-xs text-[#255620] mt-2">{archivo.filename}</p>
                    )}
                    {archivo.status === "error" && (
                      <p className="text-xs text-[#B42318] mt-2">{archivo.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nota-planilla">Nota (opcional)</Label>
                    <textarea
                      id="nota-planilla"
                      value={nota}
                      onChange={(event) => setNota(event.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm"
                    />
                  </div>
                  {cargar.error && (
                    <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">{cargar.error.message}</p>
                  )}
                  <Button
                    type="button"
                    onClick={() => void guardar()}
                    disabled={archivo.status !== "done" || !fecha || cargar.isPending}
                    className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white"
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
