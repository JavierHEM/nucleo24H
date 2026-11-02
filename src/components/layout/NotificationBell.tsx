"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBell } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";

function hace(date: Date | string) {
  const ms = Date.now() - new Date(date).getTime();
  const min = Math.max(1, Math.round(ms / 60_000));
  if (min < 60) return `hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} d`;
}

export function NotificationBell() {
  const [abierto, setAbierto] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: count } = trpc.comunicaciones.contadorNoLeidos.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: avisos } = trpc.comunicaciones.notificaciones.useQuery(
    { limit: 20 },
    { enabled: abierto, refetchInterval: abierto ? 15_000 : false }
  );

  const marcarUna = trpc.comunicaciones.marcarNotificacionLeida.useMutation({
    onSuccess: () => {
      void utils.comunicaciones.contadorNoLeidos.invalidate();
      void utils.comunicaciones.notificaciones.invalidate();
    },
  });
  const marcarTodas = trpc.comunicaciones.marcarTodasLeidas.useMutation({
    onSuccess: () => {
      void utils.comunicaciones.contadorNoLeidos.invalidate();
      void utils.comunicaciones.notificaciones.invalidate();
    },
  });

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

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notificaciones-propias")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Notificacion" }, () => {
        void utils.comunicaciones.contadorNoLeidos.invalidate();
        void utils.comunicaciones.notificaciones.invalidate();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [utils]);

  const unread = count ?? 0;

  function abrirAviso(aviso: { id: string; href: string; leida: boolean }) {
    if (!aviso.leida) marcarUna.mutate({ id: aviso.id });
    setAbierto(false);
    router.push(aviso.href);
  }

  return (
    <div ref={panel} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className="relative w-12 h-12 rounded-[10px] bg-white border border-[#DDE3EA] text-[#0B1B33] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
        title={unread > 0 ? `${unread} notificación${unread > 1 ? "es" : ""} sin leer` : "Notificaciones"}
      >
        <IconBell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#B42318] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white border border-[#DDE3EA] rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDE3EA]">
            <p className="text-sm font-extrabold text-[#0B1B33]">Notificaciones</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => marcarTodas.mutate()}
                className="text-xs font-semibold text-[#2F6B2A] hover:underline min-h-8"
              >
                Marcar todas
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
            {!avisos || avisos.length === 0 ? (
              <li className="px-4 py-8 text-sm text-[#5B6980] text-center">No hay avisos por ahora.</li>
            ) : (
              avisos.map((aviso) => (
                <li key={aviso.id}>
                  <button
                    type="button"
                    onClick={() => abrirAviso(aviso)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#F4F6F3] ${aviso.leida ? "" : "bg-[#E5F1E3]/40"}`}
                  >
                    <p className={`text-sm ${aviso.leida ? "font-medium text-[#41506A]" : "font-bold text-[#0B1B33]"}`}>
                      {aviso.titulo}
                    </p>
                    <p className="text-xs text-[#5B6980] mt-0.5 line-clamp-2">{aviso.cuerpo}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-1">{hace(aviso.created_at)}</p>
                  </button>
                </li>
              ))
            )}
          </ul>

          <Link
            href="/comunicaciones"
            onClick={() => setAbierto(false)}
            className="block text-center text-sm font-semibold text-[#2F6B2A] px-4 py-3 border-t border-[#DDE3EA] hover:bg-[#F4F6F3]"
          >
            Ver peticiones
          </Link>
        </div>
      )}
    </div>
  );
}
