export const APP_NAME = "Nucleo 24H";
export const APP_NAME_UPPER = "NUCLEO 24H";
export const APP_LEGAL_NAME = "Nucleo 24H SpA";
export const APP_TAGLINE = "Gestión y Cumplimiento Integral";
export const APP_FOOTER =
  "Nucleo 24H · Gestión y Cumplimiento Integral · Osorno, Chile";
export const APP_PAGE_TITLE = "Nucleo 24H — Gestión y Cumplimiento Integral";

export const LOGO_PATHS = {
  principal: "/logo/principal.png",
  negativo: "/logo/negativo.png",
  isotipo: "/logo/isotipo.svg",
  isotipoNegativo: "/logo/isotipo-negativo.svg",
} as const;

export const LOGO_SIZE = { width: 1320, height: 508 } as const;

export const PRODUCTION_URL = "https://nucleo24h.cl";

export function getAppUrl(): string {
  const fallback =
    process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000";
  return (process.env.NEXT_PUBLIC_APP_URL ?? fallback).replace(/\/$/, "");
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

/** TODO(Núcleo): completar con los datos reales de contacto; mientras sean null la pantalla Soporte los muestra como pendientes. */
export const CONTACTO_SOPORTE = {
  whatsapp: null as string | null,
  correo: null as string | null,
  horario: null as string | null,
};
