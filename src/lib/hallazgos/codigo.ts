/** Código corto y estable: H- + primeros 8 hex del UUID. */
export function codigoHallazgo(id: string): string {
  return `H-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function normalizarCodigoHallazgo(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function coincideCodigoHallazgo(id: string, raw: string): boolean {
  const input = normalizarCodigoHallazgo(raw);
  if (!input) return false;
  const compact = id.replace(/-/g, "").toUpperCase();
  const corto = compact.slice(0, 8);
  return (
    input === compact ||
    input === corto ||
    input === `H${corto}` ||
    raw.trim().toLowerCase() === id.toLowerCase()
  );
}

export function hallazgoPorCodigo<T extends { id: string }>(items: T[], raw: string): T[] {
  return items.filter((item) => coincideCodigoHallazgo(item.id, raw));
}
