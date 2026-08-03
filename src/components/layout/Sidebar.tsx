"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/branding";
import { BrandLogo } from "@/components/BrandLogo";
import {
  IconLayoutDashboard,
  IconThermometer,
  IconFileDescription,
  IconMedal,
  IconMapPin,
  IconSchool,
  IconMessage2,
  IconUser,
  IconUsers,
  IconSettings,
  IconBuildingStore,
  IconUserCheck,
  IconShield,
  IconArrowLeft,
  IconChecklist,
  IconChartBar,
  IconCreditCard,
} from "@tabler/icons-react";
import type { UserRole } from "@/server/trpc/context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
}

const DASHBOARD_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: IconLayoutDashboard,
    roles: ["admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/tareas",
    label: "Tareas",
    icon: IconChecklist,
    roles: ["trabajador_local", "admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/registros",
    label: "Registros",
    icon: IconThermometer,
    roles: ["trabajador_local", "admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/documentos",
    label: "Documentos",
    icon: IconFileDescription,
    roles: ["admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/sellos",
    label: "Sellos",
    icon: IconMedal,
    roles: ["admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/visitas",
    label: "Visitas",
    icon: IconMapPin,
    roles: ["admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/capacitaciones",
    label: "Capacitaciones",
    icon: IconSchool,
    roles: ["trabajador_local", "admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/comunicaciones",
    label: "Comunicaciones",
    icon: IconMessage2,
    roles: ["admin_local", "asesor", "admin_nucleo"],
  },
  {
    href: "/equipo",
    label: "Mi Equipo",
    icon: IconUsers,
    roles: ["admin_local", "admin_nucleo"],
  },
  {
    href: "/suscripcion",
    label: "Suscripción",
    icon: IconCreditCard,
    roles: ["admin_local", "admin_nucleo"],
  },
  {
    href: "/mi-cuenta",
    label: "Mi Cuenta",
    icon: IconUser,
    roles: ["trabajador_local", "admin_local", "asesor", "admin_nucleo"],
  },
];

const ADMIN_ITEMS: NavItem[] = [
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
    href: "/admin/pagos",
    label: "Pagos",
    icon: IconCreditCard,
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
    label: "Configuración",
    icon: IconSettings,
    roles: ["admin_nucleo"],
  },
];

const ASESOR_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: IconLayoutDashboard, roles: ["asesor", "admin_nucleo"] },
  { href: "/asesor/informes", label: "Mis Informes", icon: IconChartBar, roles: ["asesor", "admin_nucleo"] },
  { href: "/visitas", label: "Visitas", icon: IconMapPin, roles: ["asesor", "admin_nucleo"] },
  { href: "/sellos", label: "Sellos", icon: IconMedal, roles: ["asesor", "admin_nucleo"] },
  { href: "/comunicaciones", label: "Mensajes", icon: IconMessage2, roles: ["asesor", "admin_nucleo"] },
  { href: "/mi-cuenta", label: "Mi Cuenta", icon: IconUser, roles: ["asesor", "admin_nucleo"] },
];

interface SidebarProps {
  userRole: UserRole | null;
  mode?: "dashboard" | "admin" | "asesor";
}

export function Sidebar({ userRole, mode = "dashboard" }: SidebarProps) {
  const pathname = usePathname();

  const items = mode === "admin" ? ADMIN_ITEMS : mode === "asesor" ? ASESOR_ITEMS : DASHBOARD_ITEMS;
  const visibleItems = items.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0B2545] text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <BrandLogo variant="mark" className="w-11 h-11" priority />
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{APP_NAME}</p>
          <p className="text-[11px] text-white/50 truncate">
            {mode === "admin" ? "Panel Admin" : "Gestión y cumplimiento"}
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${
                  isActive
                    ? "bg-[#143556] text-white border-l-[3px] border-[#4B8B2E] pl-[9px]"
                    : "text-white/70 hover:bg-[#143556] hover:text-white"
                }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Toggle entre dashboard/asesor/admin */}
      {(userRole === "admin_nucleo" || userRole === "asesor") && (
        <div className="px-3 pb-3 border-t border-white/10 pt-3 space-y-0.5">
          {mode !== "dashboard" && (
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-[#143556] hover:text-white transition-all"
            >
              <IconArrowLeft size={18} />
              Dashboard
            </Link>
          )}
          {userRole === "asesor" && mode !== "asesor" && (
            <Link
              href="/asesor/informes"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-[#143556] hover:text-white transition-all"
            >
              <IconChartBar size={18} />
              Mis Informes
            </Link>
          )}
          {userRole === "admin_nucleo" && mode !== "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-[#143556] hover:text-white transition-all"
            >
              <IconSettings size={18} />
              Panel Admin
            </Link>
          )}
        </div>
      )}

      {/* Osorno, Chile */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-[11px] text-white/30">Osorno, Chile</p>
      </div>
    </aside>
  );
}
