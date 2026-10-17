"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { IconBell } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";

interface Props {
  tenantActivo?: string;
}

/**
 * Campana de notificaciones con badge de mensajes no leídos.
 * Se suscribe a cambios en la tabla Mensaje via Supabase Realtime
 * para actualizar el contador sin necesidad de refresh.
 */
export function NotificationBell({ tenantActivo }: Props) {
  const utils = trpc.useUtils();
  const { data: count } = trpc.comunicaciones.contadorNoLeidos.useQuery(undefined, {
    enabled: !!tenantActivo,
    refetchInterval: 60_000,
  });

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!tenantActivo) return;
    const supabase = createClient();

    channelRef.current = supabase
      .channel(`mensajes:${tenantActivo}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Mensaje",
          filter: `tenant_id=eq.${tenantActivo}`,
        },
        () => {
          void utils.comunicaciones.contadorNoLeidos.invalidate();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channelRef.current!);
    };
  }, [tenantActivo, utils]);

  const unread = count ?? 0;

  return (
    <Link
      href="/comunicaciones"
      className="relative w-12 h-12 rounded-[10px] bg-white border border-[#DDE3EA] text-[#0B1B33] flex items-center justify-center"
      title={unread > 0 ? `${unread} mensaje${unread > 1 ? "s" : ""} sin leer` : "Comunicaciones"}
    >
      <IconBell size={20} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#B42318] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
