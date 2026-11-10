"use client";

import { useMemo, useState } from "react";
import {
  IconBuildingStore,
  IconFilter,
  IconSearch,
  IconShieldHalf,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { InvitarMiembroButton } from "./InvitarMiembroButton";
import { claveRut } from "@/lib/empresas";
import type { EmpresaEquipo } from "@/lib/equipo";
import { ETIQUETA_ROL } from "@/lib/roles";
import { cn, formatDate } from "@/lib/utils";

const ROLES_FILTRO = [
  { id: "todos", label: "Todos" },
  { id: "admin_local", label: "Admin local" },
  { id: "jefe_local", label: "Jefe de local" },
  { id: "trabajador_local", label: "Trabajador" },
  { id: "asesor", label: "Asesor" },
] as const;

type RolFiltro = (typeof ROLES_FILTRO)[number]["id"];

type Props = {
  empresas: EmpresaEquipo[];
  puedeAsignarCargos: boolean;
};

function coincideBusqueda(empresa: EmpresaEquipo, miembro: EmpresaEquipo["miembros"][number], q: string): boolean {
  if (!q) return true;
  const hay = [
    miembro.nombre,
    miembro.email,
    empresa.nombre,
    empresa.rut,
    ...miembro.locales.map((local) => local.nombre),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("es");
  return hay.includes(q);
}

export function EquipoNucleoVista({ empresas, puedeAsignarCargos }: Props) {
  const [empresaRut, setEmpresaRut] = useState("todas");
  const [rol, setRol] = useState<RolFiltro>("todos");
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    return empresas
      .filter((empresa) => empresaRut === "todas" || claveRut(empresa.rut) === empresaRut)
      .map((empresa) => ({
        ...empresa,
        miembros: empresa.miembros.filter((miembro) => {
          if (rol !== "todos" && miembro.rol !== rol) return false;
          return coincideBusqueda(empresa, miembro, q);
        }),
      }))
      .filter((empresa) => empresa.miembros.length > 0);
  }, [empresas, empresaRut, rol, busqueda]);

  const personas = filtradas.flatMap((empresa) => empresa.miembros);
  const idsPersona = new Set(personas.map((p) => p.id));
  const idsLocal = new Set(personas.flatMap((p) => p.locales.map((l) => l.id)));
  const activos = new Set(personas.filter((p) => p.activo).map((p) => p.id)).size;
  const hayFiltro = empresaRut !== "todas" || rol !== "todos" || busqueda.trim() !== "";

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconUsers size={26} className="text-[#2F6B2A]" />
            Equipo y usuarios
          </h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Personas agrupadas por empresa (RUT). Filtra por empresa o rol para ubicar a cada miembro.
          </p>
        </div>
        <InvitarMiembroButton puedeAsignarCargos={puedeAsignarCargos} />
      </div>

      <p className="text-xs text-[#5B6980] -mt-3">
        La invitación se aplica al local activo del menú superior. Para quitar a alguien, entra al local correspondiente.
      </p>

      <ScoreCards
        items={[
          {
            label: "Empresas",
            value: filtradas.length,
            hint: hayFiltro ? "Con coincidencias" : "Con equipo",
            tone: "neutral",
          },
          {
            label: "Personas",
            value: idsPersona.size,
            hint: hayFiltro ? "Tras el filtro" : "En la red",
            tone: "neutral",
          },
          {
            label: "Locales",
            value: idsLocal.size,
            hint: "Donde aparecen",
            tone: "neutral",
          },
          {
            label: "Activos",
            value: activos,
            hint: "Con acceso",
            tone: idsPersona.size > 0 && activos === idsPersona.size ? "ok" : "alerta",
          },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Buscar persona, correo o local</span>
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6980]" aria-hidden />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar persona, correo o local"
            className="h-10 w-full rounded-xl border border-[#DDE3EA] bg-white pl-9 pr-3 text-sm text-[#0B1B33] placeholder:text-[#5B6980] focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]/40"
          />
        </label>
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-[#334155]">Empresa</span>
          <select
            value={empresaRut}
            onChange={(e) => setEmpresaRut(e.target.value)}
            className="h-10 min-w-[220px] rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm text-[#0B1B33] focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]/40"
          >
            <option value="todas">Todas las empresas</option>
            {empresas.map((empresa) => (
              <option key={claveRut(empresa.rut)} value={claveRut(empresa.rut)}>
                {empresa.nombre} · {empresa.rut}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <IconFilter size={15} className="text-[#5B6980] shrink-0" aria-hidden />
        {ROLES_FILTRO.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRol(item.id)}
            className={cn(
              "text-sm px-3 py-1.5 rounded-full border transition-colors",
              rol === item.id
                ? "bg-[#16294A] text-white border-[#16294A]"
                : "bg-white text-[#334155] border-[#DDE3EA] hover:border-[#16294A] hover:text-[#16294A]"
            )}
          >
            {item.label}
          </button>
        ))}
        {hayFiltro && (
          <button
            type="button"
            onClick={() => {
              setEmpresaRut("todas");
              setRol("todos");
              setBusqueda("");
            }}
            className="text-sm text-[#16294A] underline underline-offset-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {empresas.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <IconBuildingStore size={32} className="mx-auto text-[#DDE3EA] mb-3" />
          <p className="font-semibold text-[#0B1B33]">Sin usuarios vinculados a empresas</p>
          <p className="text-sm text-[#5B6980] mt-1">
            Cuando invites locales o asignes asesores, aparecerán agrupados por RUT.
          </p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-[#DDE3EA] p-12 text-center">
          <p className="font-semibold text-[#0B1B33]">Ningún usuario coincide</p>
          <p className="text-sm text-[#5B6980] mt-1">Prueba con otra empresa, rol o búsqueda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Miembro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">
                  Locales
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden lg:table-cell">
                  Desde
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden sm:table-cell">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EA]">
              {filtradas.map((empresa) => (
                <EmpresaFilas key={claveRut(empresa.rut)} empresa={empresa} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-[#F4F6F3] rounded-xl border border-[#DDE3EA] p-4 text-xs text-[#5B6980]">
        <p className="font-medium text-[#0B1B33] mb-3">Permisos por rol</p>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li>
            <span className="font-medium text-[#0B1B33]">Trabajador:</span> Registros BPM, tareas diarias y capacitaciones.
          </li>
          <li>
            <span className="font-medium text-[#0B1B33]">Jefe de local:</span> Opera el local, sube documentos y gestiona al equipo. Puede tener más de un local a cargo.
          </li>
          <li>
            <span className="font-medium text-[#0B1B33]">Admin local:</span> Todo lo anterior, más la suscripción del local.
          </li>
        </ul>
      </div>
    </div>
  );
}

function EmpresaFilas({ empresa }: { empresa: EmpresaEquipo }) {
  const sucursales = Math.max(0, empresa.locales.length - 1);

  return (
    <>
      <tr className="bg-[#F1F5F9]">
        <td colSpan={5} className="px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0B1B33]">
                {empresa.nombre} · {empresa.rut}
              </p>
              <p className="text-xs text-[#5B6980]">
                {empresa.miembros.length} persona{empresa.miembros.length === 1 ? "" : "s"} ·{" "}
                {empresa.locales.length === 1
                  ? "1 local · casa matriz"
                  : `${empresa.locales.length} locales · ${sucursales} sucursal${sucursales === 1 ? "" : "es"}`}
              </p>
            </div>
          </div>
        </td>
      </tr>
      {empresa.miembros.map((miembro) => {
        const rolInfo = ETIQUETA_ROL[miembro.rol] ?? {
          label: miembro.rol,
          className: "bg-gray-100 text-gray-600",
        };
        const esAdmin =
          miembro.rol === "admin_local" || miembro.rol === "admin_nucleo" || miembro.rol === "jefe_local";
        const extraLocales = Math.max(0, miembro.locales.length - 2);

        return (
          <tr key={`${empresa.rut}-${miembro.id}`} className="hover:bg-[#F4F6F3] transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                    esAdmin ? "bg-[#16294A]" : "bg-[#2F6B2A]"
                  }`}
                >
                  {(miembro.nombre ?? miembro.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#0B1B33] truncate">{miembro.nombre ?? "(sin nombre)"}</p>
                  <p className="text-xs text-[#5B6980] truncate">{miembro.email}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${rolInfo.className}`}
              >
                {esAdmin ? <IconShieldHalf size={11} /> : <IconUser size={11} />}
                {rolInfo.label}
              </span>
            </td>
            <td className="px-4 py-3 hidden md:table-cell">
              <div className="flex flex-wrap gap-1">
                {miembro.locales.slice(0, 2).map((local) => (
                  <span
                    key={local.id}
                    className="text-[10px] font-medium uppercase tracking-wide text-[#16294A] border border-[#DDE3EA] rounded px-1.5 py-0.5"
                  >
                    {local.nombre}
                  </span>
                ))}
                {extraLocales > 0 && (
                  <span className="text-[10px] font-medium text-[#5B6980] px-1.5 py-0.5">+{extraLocales}</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 text-[#5B6980] hidden lg:table-cell">{formatDate(miembro.created_at)}</td>
            <td className="px-4 py-3 hidden sm:table-cell">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  miembro.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                }`}
              >
                {miembro.activo ? "Activo" : "Inactivo"}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}
