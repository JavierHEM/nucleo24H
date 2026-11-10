import Link from "next/link";
import { IconBuildingStore, IconChevronRight, IconSearch } from "@tabler/icons-react";
import { getCaller } from "@/lib/trpc/server";
import { agruparPorEmpresa, claveRut } from "@/lib/empresas";
import {
  ETIQUETA_ESTADO_EMPRESA,
  estadoEmpresa,
  type EstadoEmpresa,
} from "@/lib/locales/estado";
import { resumenLocalesEmpresa } from "@/lib/locales/etiquetasEmpresa";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { InvitarLocalButton } from "./InvitarLocalButton";

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "activas", label: "Activas" },
  { id: "pendientes", label: "Pendientes" },
  { id: "suspendidas", label: "Suspendidas" },
  { id: "baja", label: "De baja" },
] as const;

type Filtro = (typeof FILTROS)[number]["id"];

function filtroDesde(valor: string | undefined): Filtro {
  return FILTROS.some((item) => item.id === valor) ? (valor as Filtro) : "todas";
}

function hrefFiltro(filtro: Filtro, q: string) {
  const params = new URLSearchParams();
  if (filtro !== "todas") params.set("estado", filtro);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/locales?${query}` : "/admin/locales";
}

function coincideFiltro(estado: EstadoEmpresa, filtro: Filtro) {
  if (filtro === "todas") return true;
  if (filtro === "activas") return estado === "activa";
  if (filtro === "pendientes") return estado === "pendiente";
  if (filtro === "suspendidas") return estado === "suspendida";
  return estado === "baja";
}

export default async function AdminLocalesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filtro = filtroDesde(params.estado);
  const q = (params.q ?? "").trim();
  const caller = await getCaller();
  const locales = await caller.locales.list({ limit: 500 }).catch(() => []);

  const empresas = agruparPorEmpresa(locales).map((empresa) => {
    const filas = [empresa.casaCentral, ...empresa.sucursales];
    return {
      ...empresa,
      estado: estadoEmpresa(filas.map((local) => local.estado)),
      cantidad: filas.length,
    };
  });

  const busqueda = q.toLowerCase();
  const visibles = empresas.filter((empresa) => {
    if (!coincideFiltro(empresa.estado, filtro)) return false;
    if (!busqueda) return true;
    const razon = empresa.casaCentral.empresa?.razon_social?.toLowerCase() ?? "";
    const telefono = empresa.casaCentral.empresa?.telefono ?? "";
    return (
      empresa.casaCentral.nombre.toLowerCase().includes(busqueda) ||
      razon.includes(busqueda) ||
      telefono.includes(q) ||
      claveRut(empresa.rut).includes(claveRut(q))
    );
  });

  const sucursales = Math.max(0, locales.length - empresas.length);
  const conteos: Record<Filtro, number> = {
    todas: empresas.length,
    activas: empresas.filter((e) => e.estado === "activa").length,
    pendientes: empresas.filter((e) => e.estado === "pendiente").length,
    suspendidas: empresas.filter((e) => e.estado === "suspendida").length,
    baja: empresas.filter((e) => e.estado === "baja").length,
  };

  const vacio = q
    ? `Ninguna empresa coincide con “${q}”.`
    : filtro === "activas"
      ? "No hay empresas con locales activos."
      : filtro === "pendientes"
        ? "No hay empresas pendientes de pago."
        : filtro === "suspendidas"
          ? "No hay empresas suspendidas."
          : filtro === "baja"
            ? "No hay empresas de baja."
            : "Sin empresas registradas.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#0B1B33]">Empresas</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Entra a una empresa para ver su ficha y locales. Si hay un solo local, ese es la casa matriz.
          </p>
        </div>
        <InvitarLocalButton />
      </div>

      <ScoreCards
        items={[
          { label: "Empresas", value: empresas.length, hint: "Ficha legal única", tone: "neutral" },
          { label: "Locales", value: locales.length, hint: "Cada uno con su plan", tone: "neutral" },
          { label: "Sucursales", value: sucursales, hint: "Cada sucursal se cobra aparte", tone: "neutral" },
          {
            label: "Activas",
            value: conteos.activas,
            hint:
              conteos.pendientes > 0
                ? `${conteos.pendientes} pendiente${conteos.pendientes === 1 ? "" : "s"} de pago`
                : conteos.suspendidas + conteos.baja > 0
                  ? `${conteos.suspendidas + conteos.baja} sin operar`
                  : "Todas operando",
            tone: empresas.length === 0 ? "neutral" : conteos.activas === empresas.length ? "ok" : "alerta",
          },
        ]}
      />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <nav aria-label="Filtrar empresas" className="flex flex-wrap gap-2">
          {FILTROS.map((item) => {
            const seleccionado = item.id === filtro;
            return (
              <Link
                key={item.id}
                href={hrefFiltro(item.id, q)}
                aria-current={seleccionado ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] ${
                  seleccionado
                    ? "bg-[#0B1B33] text-white"
                    : "bg-white text-[#334155] border border-[#DDE3EA] hover:bg-[#F8FAFC]"
                }`}
              >
                {item.label}
                <span className={seleccionado ? "text-white/70" : "text-[#94A3B8]"}>{conteos[item.id]}</span>
              </Link>
            );
          })}
        </nav>

        <form method="get" action="/admin/locales" className="flex gap-2 lg:ml-auto w-full lg:w-auto">
          {filtro !== "todas" && <input type="hidden" name="estado" value={filtro} />}
          <label className="relative flex-1 lg:w-72">
            <span className="sr-only">Buscar empresa</span>
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre o RUT"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDE3EA] text-sm text-[#0B1B33] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]/30 focus:border-[#2F6B2A]"
            />
          </label>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl border border-[#DDE3EA] text-sm font-medium text-[#16294A] hover:bg-[#F8FAFC]"
          >
            Buscar
          </button>
        </form>
      </div>

      {visibles.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <IconBuildingStore size={32} className="mx-auto text-[#DDE3EA] mb-3" />
          <p className="text-sm text-[#5B6980]">{vacio}</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {visibles.map((empresa) => {
            const badge = ETIQUETA_ESTADO_EMPRESA[empresa.estado];
            const sucursalesEmpresa = empresa.sucursales.length;
            return (
              <li key={claveRut(empresa.rut)}>
                <Link
                  href={`/admin/locales/${encodeURIComponent(claveRut(empresa.rut))}`}
                  className="flex items-center gap-4 rounded-xl border border-[#DDE3EA] bg-white p-4 sm:p-5 hover:border-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F1E3] text-[#2F6B2A]">
                    <IconBuildingStore size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-[#0B1B33]">
                        {empresa.casaCentral.empresa?.razon_social || empresa.casaCentral.nombre}
                      </span>
                      <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${badge.className}`}>
                        {badge.label}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-[#5B6980]">
                      RUT {empresa.casaCentral.empresa?.rut || empresa.rut}
                      {empresa.casaCentral.empresa?.telefono ? ` · ${empresa.casaCentral.empresa.telefono}` : ""}
                      {empresa.casaCentral.nombre !== empresa.casaCentral.empresa?.razon_social
                        ? ` · ${empresa.casaCentral.nombre}`
                        : ""}
                    </span>
                  </span>
                  <span className="hidden sm:block text-right shrink-0">
                    <span className="block text-sm font-semibold text-[#0B1B33]">
                      {resumenLocalesEmpresa(empresa.cantidad)}
                    </span>
                    <span className="block text-xs text-[#5B6980] mt-0.5">
                      {sucursalesEmpresa === 0 ? "Es el local de la empresa" : "Cada local paga su plan"}
                    </span>
                  </span>
                  <IconChevronRight size={18} className="shrink-0 text-[#94A3B8]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
