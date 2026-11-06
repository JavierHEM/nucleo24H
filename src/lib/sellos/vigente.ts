/** El sello se calcula y entrega al cierre del mes. El vigente es el último emitido. */
export function selloVigente<T extends { estado: string; periodo: string }>(
  sellos: readonly T[]
): T | null {
  const emitidos = sellos.filter((sello) => sello.estado === "emitido");
  if (emitidos.length === 0) return null;
  return [...emitidos].sort((a, b) => b.periodo.localeCompare(a.periodo))[0] ?? null;
}

export function selloEsDelPeriodoEnCurso(periodoSello: string, periodoActual: string): boolean {
  return periodoSello === periodoActual;
}
