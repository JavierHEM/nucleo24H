export const APP_NAME = "Núcleo 24H";
export const APP_NAME_UPPER = "NÚCLEO 24H";
export const APP_LEGAL_NAME = "Nucleo 24H SpA";
export const APP_TAGLINE = "Gestión y Cumplimiento Integral";
export const APP_FOOTER =
  "Núcleo 24H · Gestión y Cumplimiento Integral · Osorno, Chile";
export const APP_PAGE_TITLE = "Núcleo 24H — Gestión y Cumplimiento Integral";

export const LOGO_PATHS = {
  principal: "/logo/principal.png",
  negativo: "/logo/negativo.png",
  isotipo: "/logo/isotipo.svg",
  isotipoNegativo: "/logo/isotipo-negativo.svg",
} as const;

export const LOGO_SIZE = { width: 1320, height: 508 } as const;

export const PRODUCTION_URL = "https://nucleo24h.cl";

/** QR, PDFs e invitaciones nunca deben apuntar a localhost ni a un deploy de Vercel. */
export function esUrlPublicaDeLaApp(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return false;
    if (host.endsWith(".local") || host.endsWith(".vercel.app")) return false;
    return true;
  } catch {
    return false;
  }
}

export function getAppUrl(): string {
  const candidata = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (candidata && esUrlPublicaDeLaApp(candidata)) return candidata;
  return PRODUCTION_URL;
}

export function absoluteAssetUrl(path: string): string {
  return `${getAppUrl()}${path}`;
}

/** Paleta oficial alineada al logo */
export const BRAND = {
  navy: "#0B1B33",
  navyMid: "#16294A",
  navyDark: "#081C33",
  green: "#2F6B2A",
  greenDark: "#255620",
  greenLight: "#E5F1E3",
  bg: "#F4F6F3",
  white: "#FFFFFF",
} as const;

export const CONTACTO_CORREO = "contacto@nucleo24h.cl";

/**
 * WhatsApp y horario: TODO(Núcleo) hasta que el cliente los confirme.
 * No inventar número ni horario.
 * Mercado Pago: el código soporta prueba y producción. El corte es
 * MERCADOPAGO_ACCESS_TOKEN + MERCADOPAGO_WEBHOOK_SECRET + MERCADOPAGO_MODO.
 */
export const CONTACTO_SOPORTE = {
  whatsapp: null as string | null,
  correo: CONTACTO_CORREO,
  horario: null as string | null,
};
