import { agruparPorEmpresa, claveRut, type GrupoEmpresa } from "@/lib/empresas";

export type LocalSelectorItem = {
  id: string;
  nombre: string;
  rut: string;
  created_at: Date | string;
};

export function coincidenConBusqueda(locales: LocalSelectorItem[], query: string): LocalSelectorItem[] {
  const bruto = query.trim().toLowerCase();
  if (!bruto) return locales;
  const rutQuery = bruto.replace(/[.\s]/g, "");
  return locales.filter((local) => {
    if (local.nombre.toLowerCase().includes(bruto)) return true;
    return claveRut(local.rut).toLowerCase().includes(rutQuery);
  });
}

export function agruparLocalesParaSelector(
  locales: LocalSelectorItem[],
  query: string
): GrupoEmpresa<LocalSelectorItem>[] {
  return agruparPorEmpresa(coincidenConBusqueda(locales, query));
}

export function localesPlanos(grupos: GrupoEmpresa<LocalSelectorItem>[]): LocalSelectorItem[] {
  return grupos.flatMap((grupo) => [grupo.casaCentral, ...grupo.sucursales]);
}
