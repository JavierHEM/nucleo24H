/** Documento maestro §12: 10 días corridos de gracia tras el vencimiento. */
export const DIAS_GRACIA_CORRIDO = 10;
/** Documento maestro §12: al sexto día la cuenta pasa a solo lectura. */
export const DIA_SOLO_LECTURA = 6;

export type EstadoSuscripcionMora = "activa" | "morosa" | "suspendida" | "cancelada";

export function diasTrasVencimiento(diaCobro: number, ahora: Date = new Date()): number {
  return ahora.getDate() - diaCobro;
}

export type FaseCobranza = "pagado" | "vigente" | "gracia" | "corte";

export function faseCobranza(args: {
  pagadoEstePeriodo: boolean;
  diaCobro: number;
  ahora?: Date;
}): { fase: FaseCobranza; dias: number } {
  const dias = diasTrasVencimiento(args.diaCobro, args.ahora ?? new Date());
  if (args.pagadoEstePeriodo) return { fase: "pagado", dias };
  if (dias >= DIA_SOLO_LECTURA) return { fase: "corte", dias };
  if (dias >= 1) return { fase: "gracia", dias };
  return { fase: "vigente", dias };
}

export function etiquetaFaseCobranza(fase: FaseCobranza, dias: number): string | null {
  if (fase === "pagado" || fase === "vigente") return null;
  if (fase === "gracia") return `Gracia: día ${dias} de ${DIAS_GRACIA_CORRIDO}`;
  return `Solo lectura desde el día ${DIA_SOLO_LECTURA}`;
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
