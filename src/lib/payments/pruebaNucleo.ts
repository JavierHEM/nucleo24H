/**
 * Cargo temporal de Mercado Pago para que Núcleo pruebe el checkout sin
 * cobrar la tarifa real. Poner en `null` cuando termine la prueba.
 * No afecta a admin_local ni al débito automático.
 */
export const MONTO_PRUEBA_MP_NUCLEO_CLP: 100 | null = 100;

export function pruebaMpNucleoActiva(): boolean {
  return MONTO_PRUEBA_MP_NUCLEO_CLP != null;
}

export function montoMercadoPagoParaRol(
  rol: string | null | undefined,
  montoCatalogo: number
): number {
  if (rol === "admin_nucleo" && MONTO_PRUEBA_MP_NUCLEO_CLP != null) {
    return MONTO_PRUEBA_MP_NUCLEO_CLP;
  }
  return montoCatalogo;
}
