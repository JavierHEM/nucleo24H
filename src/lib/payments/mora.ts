/** Documento maestro §12: 10 días corridos de gracia tras el vencimiento. */
export const DIAS_GRACIA_CORRIDO = 10;
/** Documento maestro §12: al sexto día la cuenta pasa a solo lectura. */
export const DIA_SOLO_LECTURA = 6;

export type EstadoSuscripcionMora = "activa" | "morosa" | "suspendida" | "cancelada";

export function diasTrasVencimiento(diaCobro: number, ahora: Date = new Date()): number {
  return ahora.getDate() - diaCobro;
}

export function estadoTrasImpago(args: {
  estadoActual: EstadoSuscripcionMora;
  diaCobro: number;
  pagadoEstePeriodo: boolean;
  ahora?: Date;
}): EstadoSuscripcionMora | null {
  if (args.pagadoEstePeriodo) {
    return args.estadoActual === "activa" ? null : "activa";
  }
  if (args.estadoActual === "cancelada") return null;
  const dias = diasTrasVencimiento(args.diaCobro, args.ahora ?? new Date());
  if (dias >= DIA_SOLO_LECTURA) {
    return args.estadoActual === "suspendida" ? null : "suspendida";
  }
  if (dias >= 1) {
    return args.estadoActual === "morosa" || args.estadoActual === "suspendida" ? null : "morosa";
  }
  return null;
}

export function suscripcionEscribible(args: {
  estado: string;
  accesoHasta?: Date | null;
  ahora?: Date;
}): boolean {
  const ahora = args.ahora ?? new Date();
  if (args.estado === "suspendida") return false;
  if (args.estado === "cancelada") {
    if (!args.accesoHasta) return false;
    return ahora <= args.accesoHasta;
  }
  return true;
}

export function selloPublicoVisible(args: {
  estado: string;
  accesoHasta?: Date | null;
  ahora?: Date;
}): boolean {
  const ahora = args.ahora ?? new Date();
  if (args.estado === "suspendida") return false;
  if (args.estado === "cancelada") {
    if (!args.accesoHasta) return false;
    return ahora <= args.accesoHasta;
  }
  return true;
}

export function finPeriodoPagado(ahora: Date = new Date()): Date {
  return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
}
