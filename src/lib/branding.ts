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

/** QR, PDFs y enlaces públicos nunca deben apuntar a un deploy de Vercel (pide login). */
export function esUrlPublicaDeLaApp(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.hostname.endsWith(".vercel.app")) return false;
    return true;
  } catch {
    return false;
  }
}

export function getAppUrl(): string {
  const candidata = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (candidata && esUrlPublicaDeLaApp(candidata)) return candidata;
  return process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000";
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
 * No inventar número ni horario. También pendientes del cliente (no implementar):
 * IVA en $80.000 / $150.000, días de gracia y corte por mora, débito automático,
 * y Access Token + webhook secret de Mercado Pago en modo productivo.
 */
export const CONTACTO_SOPORTE = {
  whatsapp: null as string | null,
  correo: CONTACTO_CORREO,
  horario: null as string | null,
};
