"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";

function iniciales(nombre?: string) {
  if (!nombre?.trim()) return "N";
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function UserMenu({ userName, rol }: { userName?: string; rol: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const nombre = userName?.trim() || "Cuenta";

  useEffect(() => {
    function alClick(evento: MouseEvent) {
      if (!panel.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClick);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClick);
      document.removeEventListener("keydown", alTecla);
    };
  }, []);

  async function cerrarSesion() {
    setError("");
    setCerrando(true);
    try {
      const supabase = createClient();
      const { error: fallo } = await supabase.auth.signOut();
      if (fallo) throw fallo;
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("[UserMenu] Error al cerrar sesión:", err);
      setCerrando(false);
      setError("No pudimos cerrar la sesión. Intenta de nuevo.");
    }
  }

  return (
    <div ref={panel} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex items-center gap-2 min-h-12 pl-1.5 pr-2 sm:pr-3 rounded-[10px] bg-white border border-[#DDE3EA] text-[#0B1B33] hover:border-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
        title="Cuenta"
      >
        <span className="w-9 h-9 rounded-lg bg-[#0B1B33] text-white text-xs font-extrabold tracking-wide flex items-center justify-center shrink-0">
          {iniciales(userName)}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight text-left">
          <span className="text-sm font-bold max-w-[9rem] truncate">{nombre.split(" ")[0]}</span>
          {rol && <span className="text-[11px] font-semibold text-[#5B6980]">{rol}</span>}
        </span>
        <IconChevronDown
          size={16}
          className={`hidden sm:block text-[#5B6980] transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div
          role="menu"
          aria-label="Cuenta"
          className="absolute right-0 mt-2 w-64 bg-white border border-[#DDE3EA] rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-[#DDE3EA]">
            <p className="text-sm font-extrabold text-[#0B1B33] truncate">{nombre}</p>
            {rol && <p className="text-xs font-semibold text-[#5B6980] mt-0.5">{rol}</p>}
          </div>

          <Link
            href="/mi-cuenta"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-3 min-h-12 px-4 text-sm font-semibold text-[#0B1B33] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:bg-[#E5F1E3]"
          >
            <IconUser size={18} className="text-[#2F6B2A]" />
            Mi cuenta
          </Link>

          <button
            type="button"
            role="menuitem"
            disabled={cerrando}
            onClick={() => void cerrarSesion()}
            className="w-full flex items-center gap-3 min-h-12 px-4 text-sm font-semibold text-[#9A1C12] hover:bg-[#FCE4E1] focus-visible:outline-none focus-visible:bg-[#FCE4E1] disabled:opacity-60 border-t border-[#DDE3EA]"
          >
            <IconLogout size={18} />
            {cerrando ? "Saliendo…" : "Cerrar sesión"}
          </button>
          {error && <p className="px-4 pb-3 text-xs text-[#B42318]">{error}</p>}
        </div>
      )}
    </div>
  );
}
