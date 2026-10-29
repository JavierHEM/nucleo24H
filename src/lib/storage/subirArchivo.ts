import type { BucketArchivo } from "@/lib/storage/rutas";

export const MAX_ARCHIVO_MB = 10;

export async function subirArchivo(file: File, bucket: BucketArchivo): Promise<string> {
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_ARCHIVO_MB) {
    throw new Error(`El archivo no puede superar ${MAX_ARCHIVO_MB} MB.`);
  }

  const respuesta = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, sizeMb, bucket }),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
    throw new Error(cuerpo.error ?? "No se pudo preparar la carga del archivo.");
  }

  const { uploadUrl, ruta } = (await respuesta.json()) as { uploadUrl?: string; ruta?: string };
  if (!uploadUrl || !ruta) throw new Error("No se pudo preparar la carga del archivo.");

  const subida = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!subida.ok) throw new Error(`No se pudo subir el archivo (${subida.status}).`);

  return ruta;
}
