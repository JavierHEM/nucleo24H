"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LocalSelector } from "./LocalSelector";
import { NotificationBell } from "./NotificationBell";

interface Local {
  id: string;
  nombre: string;
}

interface TopBarProps {
  userName?: string;
  locales?: Local[];
  tenantActivo?: string;
  userRole?: string | null;
}

export function TopBar({ userName, locales = [], tenantActivo, userRole }: TopBarProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const rol =
    userRole === "admin_local"
      ? "Dueño"
      : userRole === "jefe_local"
        ? "Jefe de local"
        : userRole === "trabajador_local"
          ? "Operario"
          : userRole === "asesor"
            ? "Asesor"
            : userRole === "admin_nucleo"
              ? "Núcleo"
              : null;
  const saludo = [userName?.split(" ")[0], rol].filter(Boolean).join(" · ") || "Nucleo 24H";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-8 bg-[#F4F6F3]">
      {/* Saludo */}
      <div className="flex items-center gap-3">
        <BrandLogo variant="isotipo" className="w-8 h-8 md:hidden" />
        <p className="text-sm font-semibold text-[#0B1B33]">{saludo}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Selector de local: siempre visible para admin_nucleo, o cuando hay más de 1 */}
        {locales.length > 0 && (userRole === "admin_nucleo" || locales.length > 1) && (
          <div className="md:hidden">
            <LocalSelector locales={locales} tenantActivo={tenantActivo} isAdmin={userRole === "admin_nucleo"} />
          </div>
        )}

        {/* Notificaciones */}
        <NotificationBell tenantActivo={tenantActivo} />

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#E5F1E3] flex items-center justify-center">
          <IconUser size={16} className="text-[#2F6B2A]" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 rounded-lg hover:bg-[#F4F6F3] transition-colors text-[#5B6980] hover:text-[#B42318] disabled:opacity-50"
          title="Cerrar sesión"
        >
          <IconLogout size={18} />
        </button>
      </div>
    </header>
  );
}
