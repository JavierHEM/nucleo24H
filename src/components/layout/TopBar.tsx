"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { LocalSelector } from "./LocalSelector";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import type { LocalSelectorItem } from "@/lib/locales/selector";

type Local = LocalSelectorItem;

interface TopBarProps {
  userName?: string;
  locales?: Local[];
  tenantActivo?: string;
  userRole?: string | null;
}

const ETIQUETA_ROL: Record<string, string> = {
  admin_local: "Dueño",
  jefe_local: "Jefe de local",
  trabajador_local: "Operario",
  asesor: "Asesor",
  admin_nucleo: "Núcleo",
};

export function TopBar({ userName, locales = [], tenantActivo, userRole }: TopBarProps) {
  const rol = userRole ? ETIQUETA_ROL[userRole] ?? null : null;
  const saludo = [userName?.split(" ")[0], rol].filter(Boolean).join(" · ") || "Núcleo 24H";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-8 bg-[#F4F6F3]">
      <div className="flex items-center gap-3 min-w-0">
        <BrandLogo variant="isotipo" className="w-8 h-8 md:hidden shrink-0" />
        <p className="text-sm font-semibold text-[#0B1B33] truncate">{saludo}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {locales.length > 0 && (userRole === "admin_nucleo" || locales.length > 1) && (
          <LocalSelector
            locales={locales}
            tenantActivo={tenantActivo}
            isAdmin={userRole === "admin_nucleo"}
            align="right"
          />
        )}

        <NotificationBell />
        <UserMenu userName={userName} rol={rol} />
      </div>
    </header>
  );
}
