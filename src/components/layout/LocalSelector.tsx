"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconChevronDown,
  IconBuildingStore,
  IconCheck,
  IconSearch,
} from "@tabler/icons-react";

interface Local {
  id: string;
  nombre: string;
}

interface LocalSelectorProps {
  locales: Local[];
  tenantActivo?: string;
  isAdmin?: boolean;
  tone?: "light" | "dark";
}

export function LocalSelector({ locales, tenantActivo, isAdmin = false, tone = "light" }: LocalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const localActivo = locales.find((l) => l.id === tenantActivo);

  const filtered = query.trim()
    ? locales.filter((l) => l.nombre.toLowerCase().includes(query.toLowerCase()))
    : locales;

  function handleSelect(localId: string) {
    setOpen(false);
    setQuery("");
    startTransition(async () => {
      await fetch("/api/tenant/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: localId }),
      });
      router.refresh();
    });
  }

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Foco al input de búsqueda cuando se abre
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={`flex items-center gap-2 border text-sm font-bold disabled:opacity-50 ${
          tone === "dark"
            ? "w-full min-h-14 justify-between px-3.5 rounded-xl bg-[#16294A] border-[#2A4068] text-white"
            : "px-3 py-1.5 rounded-lg bg-white border-[#DDE3EA] text-[#0B1B33] hover:bg-[#F4F6F3]"
        }`}
      >
        {tone === "dark" ? (
          <span className="flex flex-col items-start gap-0.5 min-w-0">
            <span className="text-xs font-semibold text-[#9FB0CC]">Local activo</span>
            <span className="truncate">{localActivo?.nombre ?? "Seleccionar local"}</span>
          </span>
        ) : (
          <>
            <IconBuildingStore size={15} className="text-[#2F6B2A]" />
            <span className="max-w-[140px] truncate">
              {localActivo?.nombre ?? (isAdmin ? "Seleccionar local" : "Mis locales")}
            </span>
          </>
        )}
        <IconChevronDown
          size={14}
          className={`text-[#5B6980] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#DDE3EA] rounded-xl shadow-lg py-1 w-64">
          <p className="px-3 py-1.5 text-[11px] text-[#5B6980] uppercase tracking-wide font-medium">
            {isAdmin ? "Todos los locales" : "Tus locales"}
          </p>

          {/* Búsqueda — solo si hay más de 5 locales o es admin */}
          {(isAdmin || locales.length > 5) && (
            <div className="px-2 pb-1.5">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#F4F6F3] border border-[#DDE3EA]">
                <IconSearch size={13} className="text-[#94A3B8] shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar local..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-[#94A3B8] text-center">
                Sin resultados
              </p>
            ) : (
              filtered.map((local) => (
                <button
                  key={local.id}
                  onClick={() => handleSelect(local.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0B1B33] hover:bg-[#F4F6F3] transition-colors text-left"
                >
                  <IconBuildingStore size={14} className="text-[#5B6980] shrink-0" />
                  <span className="flex-1 truncate">{local.nombre}</span>
                  {local.id === tenantActivo && (
                    <IconCheck size={14} className="text-[#2F6B2A] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
