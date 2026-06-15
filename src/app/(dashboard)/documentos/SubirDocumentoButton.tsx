"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconUpload,
  IconX,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentPeriodo } from "@/lib/utils";

const CATEGORIAS = [
  "Permiso sanitario",
  "Certificado manipulador de alimentos",
  "Procedimiento HACCP",
  "Programa de limpieza",
  "Control de plagas",
  "Registro de proveedores",
  "Certificado de fumigación",
  "Lista de asistencia",
  "Otro",
];

const schema = z.object({
  nombre: z.string().min(2, "Ingresa un nombre"),
  categoria: z.string().min(2, "Selecciona una categoría"),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  vencimiento: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "done"; url: string; filename: string }
  | { status: "error"; message: string };

export function SubirDocumentoButton() {
  const [open, setOpen] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const utils = trpc.useUtils();

  const subir = trpc.documentos.subir.useMutation({
    onSuccess: () => {
      utils.documentos.list.invalidate();
      setOpen(false);
      reset();
      setUploadState({ status: "idle" });
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mes: getCurrentPeriodo() },
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 10) {
      setUploadState({ status: "error", message: "El archivo no puede superar 10 MB." });
      return;
    }

    setUploadState({ status: "uploading", progress: 0 });

    try {
      // 1. Solicitar URL firmada al servidor
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeMb,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Error al preparar la carga");
      }

      const { uploadUrl, publicUrl } = (await res.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      // 2. Subir directamente a R2 con XMLHttpRequest para progreso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadState({
              status: "uploading",
              progress: Math.round((ev.loaded / ev.total) * 100),
            });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Error R2: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Error de red al subir el archivo"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setUploadState({ status: "done", url: publicUrl, filename: file.name });
    } catch (err) {
      setUploadState({
        status: "error",
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  async function onSubmit(data: FormData) {
    if (uploadState.status !== "done") return;

    await subir.mutateAsync({
      nombre: data.nombre,
      categoria: data.categoria,
      mes: data.mes,
      url: uploadState.url,
      vencimiento: data.vencimiento
        ? new Date(data.vencimiento).toISOString()
        : undefined,
    });
  }

  function handleClose() {
    setOpen(false);
    reset();
    setUploadState({ status: "idle" });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#3D7A35] hover:bg-[#2D5A27] text-white gap-2"
        size="sm"
      >
        <IconUpload size={16} />
        Subir documento
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-2xl">
              <p className="font-semibold text-[#0D1F3C]">Subir documento</p>
              <button onClick={handleClose} className="text-[#64748B] hover:text-[#0D1F3C]">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Zona de archivo */}
              <div>
                <Label className="block mb-2">Archivo (PDF o imagen, máx. 10 MB)</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />

                {uploadState.status === "idle" && (
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 cursor-pointer hover:border-[#3D7A35] hover:bg-[#EAF3E0]/30 transition-colors"
                  >
                    <IconUpload size={24} className="text-[#64748B]" />
                    <p className="text-sm text-[#64748B]">Haz clic para seleccionar</p>
                    <p className="text-xs text-[#64748B]">PDF, JPG, PNG, WEBP</p>
                  </label>
                )}

                {uploadState.status === "uploading" && (
                  <div className="border border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <IconLoader2 size={18} className="text-[#3D7A35] animate-spin" />
                      <span className="text-sm text-[#0D1F3C]">
                        Subiendo... {uploadState.progress}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className="h-full bg-[#3D7A35] rounded-full transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadState.status === "done" && (
                  <div className="flex items-center gap-3 border border-green-200 bg-[#EAF3E0] rounded-xl p-3">
                    <IconCircleCheck size={18} className="text-[#16A34A] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0D1F3C] truncate">
                        {uploadState.filename}
                      </p>
                      <p className="text-xs text-[#16A34A]">Archivo subido correctamente</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadState({ status: "idle" });
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-[#64748B] hover:text-[#DC2626]"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                )}

                {uploadState.status === "error" && (
                  <div className="border border-red-200 bg-red-50 rounded-xl p-3">
                    <p className="text-sm text-[#DC2626]">❌ {uploadState.message}</p>
                    <button
                      type="button"
                      onClick={() => setUploadState({ status: "idle" })}
                      className="text-xs text-[#DC2626] underline mt-1"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div>
                <Label htmlFor="nombre">Nombre del documento</Label>
                <Input
                  id="nombre"
                  placeholder="ej: Permiso sanitario 2026"
                  className="mt-1 min-h-12"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.nombre.message}</p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <select
                  id="categoria"
                  {...register("categoria")}
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A35]"
                >
                  <option value="">Seleccionar...</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.categoria.message}</p>
                )}
              </div>

              {/* Período y vencimiento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="mes">Período</Label>
                  <input
                    id="mes"
                    type="month"
                    {...register("mes")}
                    className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A35]"
                  />
                </div>
                <div>
                  <Label htmlFor="vencimiento">Vencimiento</Label>
                  <Input
                    id="vencimiento"
                    type="date"
                    className="mt-1 min-h-12"
                    {...register("vencimiento")}
                  />
                </div>
              </div>

              {/* Error del servidor */}
              {subir.error && (
                <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">
                  {subir.error.message}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#3D7A35] hover:bg-[#2D5A27] text-white"
                  disabled={uploadState.status !== "done" || subir.isPending}
                >
                  {subir.isPending ? (
                    <span className="flex items-center gap-2">
                      <IconLoader2 size={16} className="animate-spin" /> Guardando...
                    </span>
                  ) : (
                    "Guardar documento"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
