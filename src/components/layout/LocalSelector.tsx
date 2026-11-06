"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  IconBuildingStore,
  IconCheck,
  IconChevronDown,
  IconLoader2,
  IconSearch,
} from "@tabler/icons-react";
import { cambiarLocalActivo } from "@/lib/locales/cambiarLocal";
import {
  agruparLocalesParaSelector,
  localesPlanos,
  type LocalSelectorItem,
} from "@/lib/locales/selector";

interface LocalSelectorProps {
  locales: LocalSelectorItem[];
  tenantActivo?: string;
  isAdmin?: boolean;
  align?: "left" | "right";
}

export function LocalSelector({ locales, tenantActivo, isAdmin = false, align = "left" }: LocalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activo, setActivo] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const localActivo = locales.find((local) => local.id === tenantActivo);
  const grupos = useMemo(() => agruparLocalesParaSelector(locales, query), [locales, query]);
  const planos = useMemo(() => localesPlanos(grupos), [grupos]);

  useEffect(() => {
    setActivo(0);
  }, [query, open]);

  useEffect(() => {
    function alClick(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", alClick);
      document.addEventListener("keydown", alTecla);
      setTimeout(() => searchRef.current?.focus(), 30);
    }
    return () => {
      document.removeEventListener("mousedown", alClick);
      document.removeEventListener("keydown", alTecla);
    };
  }, [open]);

  async function seleccionar(localId: string) {
    if (localId === tenantActivo) {
      setOpen(false);
      setQuery("");
      return;
    }
    setPendiente(true);
    setError(null);
    try {
      await cambiarLocalActivo(localId);
    } catch (causa) {
      setPendiente(false);
      setError(causa instanceof Error ? causa.message : "No se pudo cambiar de local.");
    }
  }

  function alTeclado(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setActivo((i) => Math.min(i + 1, Math.max(planos.length - 1, 0)));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      const elegido = planos[activo];
      if (elegido) void seleccionar(elegido.id);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((valor) => !valor)}
        disabled={pendiente}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Local activo: ${localActivo?.nombre ?? (isAdmin ? "Seleccionar local" : "Mis locales")}`}
        title={localActivo?.nombre}
        className="flex items-center gap-2 h-12 min-w-0 max-w-[11rem] sm:max-w-[16rem] px-3 rounded-[10px] bg-white border border-[#DDE3EA] text-sm font-bold text-[#0B1B33] hover:bg-[#F4F6F3] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        <IconBuildingStore size={18} className="text-[#2F6B2A] shrink-0" />
        <span className="min-w-0 truncate">
          {localActivo?.nombre ?? (isAdmin ? "Seleccionar local" : "Mis locales")}
        </span>
        {pendiente ? (
          <IconLoader2 size={14} className="animate-spin text-[#5B6980] shrink-0" />
        ) : (
          <IconChevronDown
            size={14}
            className={`text-[#5B6980] shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1 z-50 bg-white border border-[#DDE3EA] rounded-xl shadow-lg w-[min(calc(100vw-2rem),22rem)] py-2 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="px-3 pb-2 text-[11px] text-[#5B6980] uppercase tracking-wide font-medium">
            {isAdmin ? "Locales por empresa" : "Tus locales"}
          </p>
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#F4F6F3] border border-[#DDE3EA]">
              <IconSearch size={14} className="text-[#94A3B8] shrink-0" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(evento) => setQuery(evento.target.value)}
                onKeyDown={alTeclado}
                placeholder="Buscar por nombre o RUT"
                aria-controls={listboxId}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#94A3B8] text-[#0B1B33]"
              />
            </div>
          </div>
          {error && <p className="px-3 pb-2 text-xs text-[#B42318]">{error}</p>}
          <div id={listboxId} role="listbox" className="max-h-72 overflow-y-auto">
            {grupos.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[#94A3B8] text-center">Sin resultados</p>
            ) : (
              grupos.map((grupo) => {
                const localesGrupo = [grupo.casaCentral, ...grupo.sucursales];
                return (
                  <div key={grupo.casaCentral.id} className="pb-1">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-[#5B6980] truncate">
                      {grupo.casaCentral.nombre}
                      <span className="font-normal font-mono"> · {grupo.rut}</span>
                    </p>
                    {localesGrupo.map((local) => {
                      const indice = planos.findIndex((item) => item.id === local.id);
                      const seleccionado = local.id === tenantActivo;
                      const enfocado = indice === activo;
                      return (
                        <button
                          key={local.id}
                          type="button"
                          role="option"
                          aria-selected={seleccionado}
                          onMouseEnter={() => setActivo(indice)}
                          onClick={() => void seleccionar(local.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                            enfocado ? "bg-[#F4F6F3]" : ""
                          }`}
                        >
                          <IconBuildingStore size={14} className="text-[#5B6980] shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-[#0B1B33]">{local.nombre}</span>
                            {grupo.sucursales.length > 0 && local.id !== grupo.casaCentral.id && (
                              <span className="block text-[11px] text-[#94A3B8]">Sucursal</span>
                            )}
                          </span>
                          {seleccionado && <IconCheck size={14} className="text-[#2F6B2A] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
