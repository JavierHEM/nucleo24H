"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconCheck,
  IconLoader2,
  IconUpload,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { ETIQUETA_ROL } from "@/lib/roles";
import {
  MAX_VIDEO_TUTORIAL_MB,
  ROLES_TUTORIAL,
  esTipoVideoTutorial,
  type RolTutorial,
} from "@/lib/tutoriales";

type RolVisible = Exclude<RolTutorial, "admin_nucleo">;
const ROLES_SELECCIONABLES: RolVisible[] = ROLES_TUTORIAL.filter(
  (rol): rol is RolVisible => rol !== "admin_nucleo"
);

const DETALLE_ROL: Record<RolVisible, string> = {
  trabajador_local: "Cocina, salón y turnos del local",
  jefe_local: "Quien opera el local día a día",
  admin_local: "Dueño o administrador del local",
  asesor: "Equipo de asesoría de Núcleo",
};

const CAMPO =
  "mt-1 w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]";

const schema = z.object({
  titulo: z.string().trim().min(3, "Ingresa un título").max(120),
  descripcion: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

type TutorialEditar = {
  id: string;
  titulo: string;
  descripcion: string;
  ruta_video: string;
  activo: boolean;
  roles: string[];
};

function tamanoArchivo(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${mb.toFixed(1)} MB`;
}

function nombreDesdeRuta(ruta: string) {
  const archivo = ruta.split("/").pop() ?? "video";
  return archivo.replace(/^\d+-/, "");
}

export function TutorialFormulario({
  abierto,
  tutorial,
  onCerrar,
}: {
  abierto: boolean;
  tutorial: TutorialEditar | null;
  onCerrar: () => void;
}) {
  const utils = trpc.useUtils();
  const crear = trpc.tutoriales.crear.useMutation();
  const actualizar = trpc.tutoriales.actualizar.useMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<RolVisible[]>(
    (tutorial?.roles ?? []).filter((rol): rol is RolVisible => ROLES_SELECCIONABLES.includes(rol as RolVisible))
  );
  const [activo, setActivo] = useState(tutorial?.activo ?? true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      titulo: tutorial?.titulo ?? "",
      descripcion: tutorial?.descripcion ?? "",
    },
  });

  const ocupado = isSubmitting || crear.isPending || actualizar.isPending || progreso !== null;
  const todosElegidos = seleccion.length === ROLES_SELECCIONABLES.length;

  function cerrar() {
    reset();
    setArchivo(null);
    setProgreso(null);
    setArrastrando(false);
    setError(null);
    onCerrar();
  }

  function tomarArchivo(file: File | null) {
    if (!file) {
      setArchivo(null);
      return;
    }
    if (!esTipoVideoTutorial(file.type)) {
      setError("El tutorial tiene que ser un video MP4, WebM o MOV.");
      setArchivo(null);
      return;
    }
    if (file.size / (1024 * 1024) > MAX_VIDEO_TUTORIAL_MB) {
      setError(`El video no puede superar ${MAX_VIDEO_TUTORIAL_MB} MB.`);
      setArchivo(null);
      return;
    }
    setError(null);
    setArchivo(file);
  }

  async function subirVideo(file: File, tutorialId?: string) {
    const sizeMb = file.size / (1024 * 1024);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        sizeMb,
        bucket: "tutoriales",
        tutorialId,
      }),
    });
    if (!res.ok) {
      const cuerpo = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(cuerpo.error ?? "No se pudo preparar la carga del video.");
    }
    const { uploadUrl, ruta } = (await res.json()) as { uploadUrl?: string; ruta?: string };
    if (!uploadUrl || !ruta) throw new Error("No se pudo preparar la carga del video.");

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setProgreso(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("No se pudo subir el video.")));
      xhr.onerror = () => reject(new Error("No se pudo subir el video."));
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
    return ruta;
  }

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      if (!tutorial && !archivo) {
        setError("Sube un video para crear el tutorial.");
        return;
      }
      if (seleccion.length === 0) {
        setError("Elige al menos un rol que pueda ver el video.");
        return;
      }
      let ruta = tutorial?.ruta_video;
      if (archivo) {
        setProgreso(0);
        ruta = await subirVideo(archivo, tutorial?.id);
      }
      if (!ruta) {
        setError("Falta el video.");
        return;
      }
      const payload = {
        titulo: data.titulo,
        descripcion: data.descripcion ?? "",
        ruta_video: ruta,
        roles: seleccion,
        activo,
      };
      if (tutorial) {
        await actualizar.mutateAsync({ id: tutorial.id, ...payload });
      } else {
        await crear.mutateAsync(payload);
      }
      await utils.tutoriales.list.invalidate();
      cerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el tutorial.");
    } finally {
      setProgreso(null);
    }
  }

  function toggleRol(rol: RolVisible) {
    setSeleccion((actual) => (actual.includes(rol) ? actual.filter((item) => item !== rol) : [...actual, rol]));
  }

  function toggleTodos() {
    setSeleccion(todosElegidos ? [] : [...ROLES_SELECCIONABLES]);
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo={tutorial ? "Editar tutorial" : "Nuevo tutorial"}
      onCerrar={cerrar}
      ancho="lg"
      pie={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={cerrar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-tutorial"
            disabled={ocupado}
            className="min-h-12 rounded-xl bg-[#2F6B2A] hover:bg-[#255620] text-white"
          >
            {ocupado && <IconLoader2 size={16} className="animate-spin" />}
            {progreso !== null ? `Subiendo… ${progreso}%` : tutorial ? "Guardar cambios" : "Publicar tutorial"}
          </Button>
        </div>
      }
    >
      <form id="form-tutorial" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-sm text-[#5B6980] -mt-1">
          Sube el video y marca qué roles lo ven. Admin Núcleo siempre tiene acceso.
        </p>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <input id="titulo" className={CAMPO} placeholder="Cómo cargar el sello del mes" {...register("titulo")} />
              {errors.titulo && <p className="text-xs text-[#B42318] mt-1">{errors.titulo.message}</p>}
            </div>
            <div>
              <Label htmlFor="descripcion">Qué enseña</Label>
              <textarea
                id="descripcion"
                rows={3}
                placeholder="En una frase, para qué sirve este video."
                className={`${CAMPO} min-h-[5.5rem] resize-none`}
                {...register("descripcion")}
              />
            </div>

            <div>
              <Label htmlFor="video">Video</Label>
              <input
                ref={fileRef}
                id="video"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="sr-only"
                tabIndex={-1}
                onChange={(evento) => {
                  tomarArchivo(evento.target.files?.[0] ?? null);
                  evento.target.value = "";
                }}
              />

              {archivo ? (
                <div className="mt-1 rounded-xl border border-[#2F6B2A]/30 bg-[#E5F1E3] p-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#2F6B2A]">
                      <IconVideo size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0B1B33] truncate">{archivo.name}</p>
                      <p className="text-xs text-[#5B6980] mt-0.5">{tamanoArchivo(archivo.size)} · listo para subir</p>
                      {progreso !== null && (
                        <div
                          className="mt-2 h-1.5 rounded-full bg-white overflow-hidden"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progreso}
                          aria-label="Progreso de carga"
                        >
                          <div className="h-full bg-[#2F6B2A] transition-[width] duration-300" style={{ width: `${progreso}%` }} />
                        </div>
                      )}
                    </div>
                    {progreso === null && (
                      <button
                        type="button"
                        aria-label="Quitar video"
                        onClick={() => setArchivo(null)}
                        className="size-11 shrink-0 rounded-lg text-[#5B6980] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
                      >
                        <IconX size={16} className="mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              ) : tutorial ? (
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-[#DDE3EA] bg-[#F4F6F3] p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#2F6B2A]">
                    <IconVideo size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B1B33] truncate">{nombreDesdeRuta(tutorial.ruta_video)}</p>
                    <p className="text-xs text-[#5B6980] mt-0.5">Se mantiene si no eliges otro archivo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="shrink-0 min-h-11 px-3 rounded-lg text-sm font-bold text-[#2F6B2A] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragEnter={(evento) => {
                    evento.preventDefault();
                    setArrastrando(true);
                  }}
                  onDragOver={(evento) => evento.preventDefault()}
                  onDragLeave={(evento) => {
                    evento.preventDefault();
                    setArrastrando(false);
                  }}
                  onDrop={(evento) => {
                    evento.preventDefault();
                    setArrastrando(false);
                    tomarArchivo(evento.dataTransfer.files[0] ?? null);
                  }}
                  className={`mt-1 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
                    arrastrando
                      ? "border-[#2F6B2A] bg-[#E5F1E3]"
                      : "border-[#DDE3EA] bg-white hover:border-[#2F6B2A] hover:bg-[#E5F1E3]/40"
                  }`}
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#E5F1E3] text-[#2F6B2A]">
                    <IconUpload size={20} />
                  </span>
                  <p className="text-sm font-semibold text-[#0B1B33]">Arrastra el video o haz clic para elegir</p>
                  <p className="text-xs text-[#5B6980]">MP4, WebM o MOV · máx. {MAX_VIDEO_TUTORIAL_MB} MB</p>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {tutorial && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DDE3EA] px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0B1B33]">Visible</p>
                  <p className="text-xs text-[#5B6980] mt-0.5">
                    {activo ? "Los roles elegidos lo ven en Tutoriales" : "Oculto para todos, menos Núcleo"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activo}
                  aria-label="Visible para los roles elegidos"
                  onClick={() => setActivo((valor) => !valor)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] focus-visible:ring-offset-2 ${
                    activo ? "bg-[#2F6B2A]" : "bg-[#DDE3EA]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform ${
                      activo ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}

            <fieldset>
              <legend className="w-full">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#0B1B33]">Quién puede verlo</span>
                  <button
                    type="button"
                    onClick={toggleTodos}
                    className="text-xs font-bold text-[#2F6B2A] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] rounded"
                  >
                    {todosElegidos ? "Quitar todos" : "Seleccionar todos"}
                  </button>
                </span>
              </legend>
              <p className="text-xs text-[#5B6980] mt-1 mb-2">
                {seleccion.length === 0
                  ? "Elige al menos un rol"
                  : `${seleccion.length} de ${ROLES_SELECCIONABLES.length} roles`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES_SELECCIONABLES.map((rol) => {
                  const elegido = seleccion.includes(rol);
                  return (
                    <button
                      key={rol}
                      type="button"
                      aria-pressed={elegido}
                      onClick={() => toggleRol(rol)}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left min-h-[4.5rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
                        elegido
                          ? "border-[#2F6B2A] bg-[#E5F1E3]"
                          : "border-[#DDE3EA] bg-white hover:border-[#2F6B2A]/50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                          elegido ? "border-[#2F6B2A] bg-[#2F6B2A] text-white" : "border-[#DDE3EA] bg-white"
                        }`}
                      >
                        {elegido ? <IconCheck size={12} stroke={3} /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0B1B33]">{ETIQUETA_ROL[rol].label}</span>
                        <span className="block text-xs text-[#5B6980] mt-0.5 leading-snug">{DETALLE_ROL[rol]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}
      </form>
    </Dialogo>
  );
}
