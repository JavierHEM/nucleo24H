import { Resend } from "resend";

import { APP_NAME } from "@/lib/branding";

export const FROM_EMAIL = `${APP_NAME} <notificaciones@send.nucleo24h.cl>`;

/** Sin API key válida los envíos se omiten y la app sigue funcionando. */
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
