import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { IconUserCheck, IconBuildingStore, IconSearch } from "@tabler/icons-react";
import { InvitarAsesorButton } from "./InvitarAsesorButton";
import { AsesorAcciones } from "./AsesorAcciones";
import { ScoreCards } from "@/components/dashboard/ScoreCards";

const FILTROS = [
  { id: "activos", label: "Activos" },
  { id: "baja", label: "De baja" },
  { id: "sin-locales", label: "Sin locales" },
  { id: "todos", label: "Todos" },
] as const;

type Filtro = (typeof FILTROS)[number]["id"];

function filtroDesde(valor: string | undefined): Filtro {
  return FILTROS.some((f) => f.id === valor) ? (valor as Filtro) : "activos";
}

function hrefFiltro(estado: Filtro, q: string) {
  const params = new URLSearchParams();
  if (estado !== "activos") params.set("estado", estado);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/asesores?${query}` : "/admin/asesores";
}

interface PageProps {
  searchParams: Promise<{ estado?: string; q?: string }>;
}

export default async function AdminAsesoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filtro = filtroDesde(params.estado);
  const q = (params.q ?? "").trim();

  const asignados = await prisma.asignacionAsesor.findMany({
    where: { activo: true },
    distinct: ["asesor_id"],
    select: { asesor_id: true },
  });
  const idsConLocal = asignados.map((a) => a.asesor_id);

  const busqueda = q
    ? {
        OR: [
          { nombre: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where =
    filtro === "baja"
      ? { rol: "asesor" as const, activo: false, ...busqueda }
      : filtro === "sin-locales"
        ? {
            rol: "asesor" as const,
            activo: true,
            ...(idsConLocal.length > 0 ? { id: { notIn: idsConLocal } } : {}),
            ...busqueda,
          }
        : filtro === "todos"
          ? { rol: "asesor" as const, ...busqueda }
          : { rol: "asesor" as const, activo: true, ...busqueda };

  const [totalActivos, totalBaja, totalSinLocales, asesores] = await Promise.all([
    prisma.user.count({ where: { rol: "asesor", activo: true } }),
    prisma.user.count({ where: { rol: "asesor", activo: false } }),
    prisma.user.count({
      where: {
        rol: "asesor",
        activo: true,
        ...(idsConLocal.length > 0 ? { id: { notIn: idsConLocal } } : {}),
      },
    }),
    prisma.user.findMany({
      where,
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, email: true, activo: true },
    }),
  ]);

  const conteos: Record<Filtro, number> = {
    activos: totalActivos,
    baja: totalBaja,
    "sin-locales": totalSinLocales,
    todos: totalActivos + totalBaja,
  };

  const localesPorAsesor = new Map<string, { id: string; nombre: string }[]>();
  if (asesores.length > 0 && filtro !== "baja" && filtro !== "sin-locales") {
    const asignaciones = await prisma.asignacionAsesor.findMany({
      where: { activo: true, asesor_id: { in: asesores.map((a) => a.id) } },
      include: { tenant: { select: { id: true, nombre: true } } },
      orderBy: { tenant: { nombre: "asc" } },
    });
    for (const asignacion of asignaciones) {
      const lista = localesPorAsesor.get(asignacion.asesor_id) ?? [];
      lista.push(asignacion.tenant);
      localesPorAsesor.set(asignacion.asesor_id, lista);
    }
  }

  const vacio = q
    ? `Ningún asesor coincide con “${q}”.`
    : filtro === "baja"
      ? "No hay asesores de baja."
      : filtro === "sin-locales"
        ? "Todos los asesores activos tienen al menos un local."
        : filtro === "todos"
          ? "Sin asesores registrados."
          : "No hay asesores activos.";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Asesores</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Cuentas de Nucleo 24H y los locales que cada una tiene a cargo.
          </p>
        </div>
        <InvitarAsesorButton />
      </div>

      <ScoreCards
        items={[
          { label: "Activos", value: totalActivos, hint: "Pueden atender locales", tone: "ok" },
          { label: "De baja", value: totalBaja, hint: "Sin acceso", tone: totalBaja > 0 ? "alerta" : "neutral" },
          { label: "Sin locales", value: totalSinLocales, hint: "Activos sin asignación", tone: totalSinLocales > 0 ? "alerta" : "ok" },
          { label: "Total", value: totalActivos + totalBaja, hint: "Cuentas de asesor", tone: "neutral" },
        ]}
      />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <nav aria-label="Filtrar asesores" className="flex flex-wrap gap-2">
          {FILTROS.map((item) => {
            const seleccionado = item.id === filtro;
            return (
              <Link
                key={item.id}
                href={hrefFiltro(item.id, q)}
                aria-current={seleccionado ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2F6B2A] ${
                  seleccionado
                    ? "bg-[#0B1B33] text-white"
                    : "bg-white text-[#334155] border border-[#DDE3EA] hover:bg-[#F8FAFC]"
                }`}
              >
                {item.label}
                <span className={seleccionado ? "text-white/70" : "text-[#94A3B8]"}>
                  {conteos[item.id]}
                </span>
              </Link>
            );
          })}
        </nav>

        <form method="get" action="/admin/asesores" className="flex gap-2 lg:ml-auto w-full lg:w-auto">
          {filtro !== "activos" && <input type="hidden" name="estado" value={filtro} />}
          <label className="relative flex-1 lg:w-72">
            <span className="sr-only">Buscar asesor</span>
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre o correo"
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

      {asesores.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <IconUserCheck size={32} className="mx-auto text-[#DDE3EA] mb-3" />
          <p className="text-sm text-[#5B6980]">{vacio}</p>
          {q && (
            <Link href={hrefFiltro(filtro, "")} className="inline-block mt-3 text-sm text-[#16294A] underline">
              Limpiar búsqueda
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Asesor</th>
                {filtro === "todos" && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Estado</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">
                  Locales
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#5B6980]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EA]">
              {asesores.map((asesor) => {
                const locales = localesPorAsesor.get(asesor.id) ?? [];
                const visibles = locales.slice(0, 3);
                const resto = locales.length - visibles.length;
                return (
                  <tr key={asesor.id} className="hover:bg-[#F4F6F3] align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0B1B33]">{asesor.nombre || asesor.email}</p>
                      <p className="text-xs text-[#5B6980]">{asesor.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 md:hidden">
                        <Locales locales={visibles} resto={resto} />
                      </div>
                    </td>
                    {filtro === "todos" && (
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-medium uppercase tracking-wide rounded px-1.5 py-0.5 ${
                            asesor.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-[#F1F5F9] text-[#5B6980]"
                          }`}
                        >
                          {asesor.activo ? "Activo" : "De baja"}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Locales locales={visibles} resto={resto} />
                    </td>
                    <td className="px-4 py-3">
                      <AsesorAcciones
                        id={asesor.id}
                        nombre={asesor.nombre || asesor.email}
                        activo={asesor.activo}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Locales({
  locales,
  resto,
}: {
  locales: { id: string; nombre: string }[];
  resto: number;
}) {
  if (locales.length === 0) {
    return <span className="text-xs text-[#94A3B8]">Sin locales</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {locales.map((local) => (
        <span
          key={local.id}
          className="inline-flex items-center gap-1 text-xs bg-[#E5F1E3] text-[#255620] rounded-full px-2.5 py-1"
        >
          <IconBuildingStore size={12} />
          {local.nombre}
        </span>
      ))}
      {resto > 0 && (
        <span className="text-xs text-[#5B6980] self-center">+{resto}</span>
      )}
    </div>
  );
}
