import { Resend } from "resend";

export const FROM_EMAIL = "Núcleo Sur <notificaciones@nucleosur.cl>";

/**
 * El cliente aún no crea la cuenta Resend — mientras tanto la API key
 * es un placeholder y todos los envíos deben degradar sin fallar.
 */
export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && key.length > 10 && key !== "re_...");
}

let client: Resend | null = null;

/** Cliente Resend lazy — solo se instancia si hay API key válida. */
export function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}
