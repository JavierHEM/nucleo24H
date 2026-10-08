import { createAdminClient } from "@/lib/supabase/admin";
import { parseRuta, type BucketArchivo } from "@/lib/storage/rutas";

function urlAbsoluta(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}${url}`;
}

export async function crearUrlDeCarga(bucket: BucketArchivo, path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data?.signedUrl) {
    console.error("[archivos] No se pudo firmar la carga:", error?.message);
    throw new Error("No se pudo preparar la carga del archivo.");
  }
  return urlAbsoluta(data.signedUrl);
}

export async function crearUrlDeLectura(ruta: string, expiresIn = 120) {
  const parsed = parseRuta(ruta);
  if (!parsed) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(parsed.bucket).createSignedUrl(parsed.path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("[archivos] No se pudo firmar la lectura:", error?.message);
    return null;
  }
  return data.signedUrl;
}
