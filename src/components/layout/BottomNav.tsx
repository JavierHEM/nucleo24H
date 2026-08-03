"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconThermometer,
  IconFileDescription,
  IconMedal,
  IconUser,
  IconBuildingStore,
  IconUserCheck,
  IconShield,
  IconSettings,
  IconChecklist,
  IconChartBar,
  IconUsers,
} from "@tabler/icons-react";
import type { UserRole } from "@/server/trpc/context";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
}

// Ítems para trabajador_local (max 5)
const TRABAJADOR_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Inicio", icon: IconLayoutDashboard, roles: ["trabajador_local"] },
  { href: "/tareas", label: "Tareas", icon: IconChecklist, roles: ["trabajador_local"] },
  { href: "/registros", label: "Registros", icon: IconThermometer, roles: ["trabajador_local"] },
  { href: "/capacitaciones", label: "Capac.", icon: IconFileDescription, roles: ["trabajador_local"] },
  { href: "/mi-cuenta", label: "Cuenta", icon: IconUser, roles: ["trabajador_local"] },
];

// Ítems para admin_local (max 5)
const ADMIN_LOCAL_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Inicio", icon: IconLayoutDashboard, roles: ["admin_local"] },
  { href: "/tareas", label: "Tareas", icon: IconChecklist, roles: ["admin_local"] },
  { href: "/sellos", label: "Sellos", icon: IconMedal, roles: ["admin_local"] },
  { href: "/equipo", label: "Equipo", icon: IconUsers, roles: ["admin_local"] },
  { href: "/mi-cuenta", label: "Cuenta", icon: IconUser, roles: ["admin_local"] },
];

const BOTTOM_ITEMS: BottomNavItem[] = [
  ...TRABAJADOR_ITEMS,
  ...ADMIN_LOCAL_ITEMS,
  { href: "/", label: "Inicio", icon: IconLayoutDashboard, roles: ["asesor", "admin_nucleo"] },
  { href: "/tareas", label: "Tareas", icon: IconChecklist, roles: ["asesor", "admin_nucleo"] },
  { href: "/sellos", label: "Sellos", icon: IconMedal, roles: ["asesor", "admin_nucleo"] },
  { href: "/comunicaciones", label: "Mensajes", icon: IconFileDescription, roles: ["asesor", "admin_nucleo"] },
  { href: "/mi-cuenta", label: "Cuenta", icon: IconUser, roles: ["asesor", "admin_nucleo"] },
];

const ADMIN_BOTTOM_ITEMS: BottomNavItem[] = [
  {
    href: "/admin",
    label: "Resumen",
    icon: IconLayoutDashboard,
    roles: ["admin_nucleo"],
  },
  {
    href: "/admin/locales",
    label: "Locales",
    icon: IconBuildingStore,
    roles: ["admin_nucleo"],
  },
  {
    href: "/admin/asesores",
    label: "Asesores",
    icon: IconUserCheck,
    roles: ["admin_nucleo"],
  },
  {
    href: "/admin/arsopb",
    label: "ARSOPB",
    icon: IconShield,
    roles: ["admin_nucleo"],
  },
  {
    href: "/admin/informes",
    label: "Informes",
    icon: IconChartBar,
    roles: ["admin_nucleo"],
  },
  {
    href: "/admin/configuracion",
    label: "Config.",
    icon: IconSettings,
    roles: ["admin_nucleo"],
  },
];

const ASESOR_BOTTOM_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Dashboard", icon: IconLayoutDashboard, roles: ["asesor", "admin_nucleo"] },
  { href: "/asesor/informes", label: "Informes", icon: IconChartBar, roles: ["asesor", "admin_nucleo"] },
  { href: "/visitas", label: "Visitas", icon: IconMedal, roles: ["asesor", "admin_nucleo"] },
  { href: "/mi-cuenta", label: "Cuenta", icon: IconUser, roles: ["asesor", "admin_nucleo"] },
];

interface BottomNavProps {
  userRole: UserRole | null;
  mode?: "dashboard" | "admin" | "asesor";
}

export function BottomNav({ userRole, mode = "dashboard" }: BottomNavProps) {
  const pathname = usePathname();

  const sourceItems =
    mode === "admin" ? ADMIN_BOTTOM_ITEMS : mode === "asesor" ? ASESOR_BOTTOM_ITEMS : BOTTOM_ITEMS;
  const visibleItems = sourceItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/" || item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[56px] transition-colors
                ${
                  isActive
                    ? "text-[#4B8B2E]"
                    : "text-[#64748B] hover:text-[#0B2545]"
                }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
