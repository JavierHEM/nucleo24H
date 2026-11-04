export const BUCKETS = ["registros", "documentos", "hallazgos"] as const;
export type BucketArchivo = (typeof BUCKETS)[number];

const RUTA =
  /^(registros|documentos|hallazgos)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[^/]+$/i;

export function parseRuta(ruta: string) {
  const match = RUTA.exec(ruta);
  if (!match) return null;
  const bucket = match[1].toLowerCase() as BucketArchivo;
  const tenantId = match[2];
  const path = ruta.slice(bucket.length + 1);
  return { bucket, tenantId, path };
}

export function rutaPertenece(ruta: string, bucket: BucketArchivo, tenantId: string) {
  const parsed = parseRuta(ruta);
  return parsed?.bucket === bucket && parsed.tenantId === tenantId;
}

export function construirRuta(bucket: BucketArchivo, tenantId: string, filename: string) {
  const ext = (filename.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const slug = filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "archivo";
  const path = `${tenantId}/${Date.now()}-${slug}.${ext}`;
  return { path, ruta: `${bucket}/${path}` };
}

export function hrefArchivo(valor: string) {
  if (valor.startsWith("https://") || valor.startsWith("http://")) return valor;
  return `/api/archivos?ruta=${encodeURIComponent(valor)}`;
}

export function esImagenRuta(ruta: string) {
  return /\.(jpe?g|png|webp)$/i.test(ruta);
}

export function sonRutasHallazgoDelLocal(rutas: string[], tenantId: string) {
  return rutas.every((ruta) => rutaPertenece(ruta, "hallazgos", tenantId));
}

export function sonRutasDocumentoDelLocal(rutas: string[], tenantId: string) {
  return rutas.every((ruta) => rutaPertenece(ruta, "documentos", tenantId));
}
