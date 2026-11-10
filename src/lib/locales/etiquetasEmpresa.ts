export function etiquetaSitioEmpresa(args: { tieneSucursales: boolean; esCasaMatriz: boolean }): string {
  if (!args.tieneSucursales) return "Casa matriz";
  return args.esCasaMatriz ? "Casa matriz" : "Sucursal";
}

export function etiquetaSiNo(valor: boolean): string {
  return valor ? "Sí" : "No";
}

export function resumenLocalesEmpresa(cantidad: number): string {
  if (cantidad <= 1) return "1 local · casa matriz";
  const sucursales = cantidad - 1;
  return `${cantidad} locales · ${sucursales} sucursal${sucursales === 1 ? "" : "es"}`;
}
