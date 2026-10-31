import { readFile } from "fs/promises";
import path from "path";
import { LOGO_PATHS, absoluteAssetUrl } from "@/lib/branding";

/** Incrustado en base64 para que el PDF no dependa de que Browserless alcance nuestra URL. */
export async function logoNegativoParaPdf(): Promise<string> {
  try {
    const archivo = await readFile(path.join(process.cwd(), "public", LOGO_PATHS.negativo));
    return `data:image/png;base64,${archivo.toString("base64")}`;
  } catch (error) {
    console.warn("[pdf] No se pudo leer el logo local, se usa la URL pública:", error);
    return absoluteAssetUrl(LOGO_PATHS.negativo);
  }
}
