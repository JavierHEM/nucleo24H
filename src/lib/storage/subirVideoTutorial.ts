import { MAX_VIDEO_TUTORIAL_MB, esTipoVideoTutorial } from "@/lib/tutoriales";

export async function subirVideoTutorial(file: File, tutorialId?: string): Promise<string> {
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_VIDEO_TUTORIAL_MB) {
    throw new Error(`El video no puede superar ${MAX_VIDEO_TUTORIAL_MB} MB.`);
  }
  if (!esTipoVideoTutorial(file.type)) {
    throw new Error("El tutorial tiene que ser un video MP4, WebM o MOV.");
  }

  const respuesta = await fetch("/api/upload", {
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
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
    throw new Error(cuerpo.error ?? "No se pudo preparar la carga del video.");
  }

  const { uploadUrl, ruta } = (await respuesta.json()) as { uploadUrl?: string; ruta?: string };
  if (!uploadUrl || !ruta) throw new Error("No se pudo preparar la carga del video.");

  const subida = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!subida.ok) throw new Error(`No se pudo subir el video (${subida.status}).`);

  return ruta;
}
