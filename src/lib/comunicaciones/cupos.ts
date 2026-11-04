export const CUPO_PROFESIONAL_MENSUAL = 5;
export const DIAS_ILIMITADOS_INICIO = 30;
export const CATEGORIAS_PROFESIONALES = new Set(["consulta", "documentos", "visita"]);
export const CATEGORIAS_SOPORTE = new Set(["incidencia", "otro", "soporte_plataforma"]);

export function esConsultaProfesional(categoria: string): boolean {
  return CATEGORIAS_PROFESIONALES.has(categoria);
}

export function periodoDe(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

export function cupoProfesional(args: {
  tenantCreadoAt: Date;
  usadasEnPeriodo: number;
  ahora?: Date;
}): { ilimitado: boolean; restantes: number; usadas: number; tope: number } {
  const ahora = args.ahora ?? new Date();
  const dias = Math.floor((ahora.getTime() - args.tenantCreadoAt.getTime()) / 86_400_000);
  if (dias < DIAS_ILIMITADOS_INICIO) {
    return { ilimitado: true, restantes: CUPO_PROFESIONAL_MENSUAL, usadas: args.usadasEnPeriodo, tope: CUPO_PROFESIONAL_MENSUAL };
  }
  return {
    ilimitado: false,
    usadas: args.usadasEnPeriodo,
    tope: CUPO_PROFESIONAL_MENSUAL,
    restantes: Math.max(0, CUPO_PROFESIONAL_MENSUAL - args.usadasEnPeriodo),
  };
}
