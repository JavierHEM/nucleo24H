"use client";

import { useEffect, useRef } from "react";
import { IconMessage2, IconCheck, IconChecks, IconLoader2 } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  tenantId?: string;
}

function formatHora(date: Date | string) {
  return new Date(date).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFecha(date: Date | string) {
  const d = new Date(date);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  if (d.toDateString() === hoy.toDateString()) return "Hoy";
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MensajesList({ userId, tenantId }: Props) {
  const utils = trpc.useUtils();
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const { data: mensajes, isLoading } = trpc.comunicaciones.list.useQuery(
    { limit: 100 },
    { refetchOnWindowFocus: false }
  );

  const marcarTodos = trpc.comunicaciones.marcarTodosLeidos.useMutation({
    onSuccess: () => {
      void utils.comunicaciones.contadorNoLeidos.invalidate();
    },
  });

  // Marcar como leídos al cargar o cuando llegan mensajes nuevos
  useEffect(() => {
    if (!mensajes) return;
    const hayNoLeidos = mensajes.some((m: { leido: boolean; para: string }) => !m.leido && m.para === userId);
    if (hayNoLeidos) marcarTodos.mutate();
    // Scroll al fondo
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensajes]);

  // Realtime: suscribirse a mensajes nuevos del tenant
  useEffect(() => {
    if (!tenantId) return;
    const supabase = createClient();
    channelRef.current = supabase
      .channel(`comunicaciones:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Mensaje",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void utils.comunicaciones.list.invalidate();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channelRef.current!);
    };
  }, [tenantId, utils]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 flex items-center justify-center">
        <IconLoader2 size={24} className="animate-spin text-[#3D7A35]" />
      </div>
    );
  }

  if (!mensajes || mensajes.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-[#E2E8F0] p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#EAF3E0] flex items-center justify-center mx-auto mb-3">
          <IconMessage2 size={24} className="text-[#3D7A35]" />
        </div>
        <p className="font-semibold text-[#0D1F3C]">Sin mensajes</p>
        <p className="text-sm text-[#64748B] mt-1">
          Usa el botón &ldquo;Nuevo mensaje&rdquo; para contactar a tu asesor o equipo.
        </p>
      </div>
    );
  }

  // Agrupar por fecha
  type Grupo = { fecha: string; items: typeof mensajes };
  const grupos: Grupo[] = [];
  for (const m of mensajes) {
    const fechaLabel = formatFecha(m.created_at);
    const ultimo = grupos[grupos.length - 1];
    if (!ultimo || ultimo.fecha !== fechaLabel) {
      grupos.push({ fecha: fechaLabel, items: [m] });
    } else {
      ultimo.items.push(m);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-[300px] max-h-[60vh]">
        {grupos.map((grupo) => (
          <div key={grupo.fecha}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-xs text-[#94A3B8] font-medium px-2">{grupo.fecha}</span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>

            {grupo.items.map((m) => {
              const esPropio = m.de === userId;
              const nombreRemitente =
                m.remitente?.nombre ||
                m.remitente?.email ||
                "Usuario";
              const inicial = nombreRemitente.charAt(0).toUpperCase();

              return (
                <div
                  key={m.id}
                  className={`flex gap-2 items-end mb-2 ${esPropio ? "justify-end" : "justify-start"}`}
                >
                  {!esPropio && (
                    <div className="w-7 h-7 rounded-full bg-[#1A3559] flex items-center justify-center shrink-0 text-white text-xs font-bold mb-1">
                      {inicial}
                    </div>
                  )}

                  <div className={`max-w-[75%] flex flex-col ${esPropio ? "items-end" : "items-start"}`}>
                    {!esPropio && (
                      <span className="text-xs text-[#64748B] font-medium mb-1 ml-1">
                        {nombreRemitente}
                      </span>
                    )}

                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        esPropio
                          ? "bg-[#1A3559] text-white rounded-br-sm"
                          : "bg-[#F5F6F8] text-[#0D1F3C] rounded-bl-sm"
                      }`}
                    >
                      {m.contenido}
                    </div>

                    <div className={`flex items-center gap-1 mt-0.5 ${esPropio ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-[#94A3B8]">
                        {formatHora(m.created_at)}
                      </span>
                      {esPropio && (
                        m.leido
                          ? <IconChecks size={12} className="text-[#3D7A35]" />
                          : <IconCheck size={12} className="text-[#94A3B8]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
