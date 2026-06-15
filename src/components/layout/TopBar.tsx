"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconLogout, IconUser } from "@tabler/icons-react";
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

  const saludo = userName
    ? `Bienvenida/o, ${userName.split(" ")[0]} 👋`
    : "Bienvenida/o 👋";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 md:px-6 bg-white border-b border-[#E2E8F0]">
      {/* Saludo */}
      <div>
        <p className="text-sm font-semibold text-[#0D1F3C]">{saludo}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Selector de local: siempre visible para admin_nucleo, o cuando hay más de 1 */}
        {locales.length > 0 && (userRole === "admin_nucleo" || locales.length > 1) && (
          <LocalSelector locales={locales} tenantActivo={tenantActivo} isAdmin={userRole === "admin_nucleo"} />
        )}

        {/* Notificaciones */}
        <NotificationBell tenantActivo={tenantActivo} />

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#EAF3E0] flex items-center justify-center">
          <IconUser size={16} className="text-[#3D7A35]" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 rounded-lg hover:bg-[#F5F6F8] transition-colors text-[#64748B] hover:text-[#DC2626] disabled:opacity-50"
          title="Cerrar sesión"
        >
          <IconLogout size={18} />
        </button>
      </div>
    </header>
  );
}
