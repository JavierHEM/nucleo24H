"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IconLayoutDashboard,
  IconThermometer,
  IconFileDescription,
  IconMedal,
  IconUser,
  IconBuildingStore,
  IconChecklist,
  IconUsers,
  IconDots,
  IconMapPin,
  IconSchool,
  IconMessage2,
  IconCreditCard,
  IconX,
  IconCalendarEvent,
  IconLeaf,
  IconGavel,
  IconLifebuoy,
  IconBadge,
  IconVideo,
} from "@tabler/icons-react";
import type { UserRole } from "@/server/trpc/context";
import { planIncluye, type ModuloPlan, type PlanId } from "@/lib/planes";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
  modulo?: ModuloPlan;
}

const TRABAJADOR_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Hoy", icon: IconLayoutDashboard, roles: ["trabajador_local"] },
  { href: "/registros", label: "Registros", icon: IconThermometer, roles: ["trabajador_local"] },
  { href: "/tareas", label: "Tareas", icon: IconChecklist, roles: ["trabajador_local"] },
  { href: "/capacitaciones", label: "Capac.", icon: IconSchool, roles: ["trabajador_local"] },
  { href: "/tutoriales", label: "Tutoriales", icon: IconVideo, roles: ["trabajador_local"] },
];

const DUENO_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Hoy", icon: IconLayoutDashboard, roles: ["admin_local", "jefe_local"] },
  { href: "/calendario", label: "Agenda", icon: IconCalendarEvent, roles: ["admin_local", "jefe_local"] },
  { href: "/hallazgos", label: "Hallazgos", icon: IconChecklist, roles: ["admin_local", "jefe_local"] },
  { href: "/sellos", label: "Sello", icon: IconMedal, roles: ["admin_local", "jefe_local"] },
];

const MAS_LOCAL: BottomNavItem[] = [
  { href: "/registros", label: "Registros", icon: IconThermometer, roles: ["jefe_local", "admin_local"] },
  { href: "/tareas", label: "Tareas", icon: IconChecklist, roles: ["jefe_local", "admin_local"] },
  { href: "/visitas", label: "Visitas", icon: IconMapPin, roles: ["jefe_local", "admin_local"] },
  { href: "/documentos", label: "Documentos", icon: IconFileDescription, roles: ["jefe_local", "admin_local"] },
  { href: "/fiscalizaciones", label: "Fiscalizaciones", icon: IconGavel, roles: ["jefe_local", "admin_local"] },
  { href: "/capacitaciones", label: "Capacitaciones", icon: IconSchool, roles: ["jefe_local", "admin_local"] },
  { href: "/proveedores", label: "Proveedores", icon: IconBuildingStore, roles: ["jefe_local", "admin_local"] },
  { href: "/ambiental", label: "Ambiental", icon: IconLeaf, roles: ["jefe_local", "admin_local"], modulo: "ambiental" },
  { href: "/tutoriales", label: "Tutoriales", icon: IconVideo, roles: ["jefe_local", "admin_local"] },
  { href: "/comunicaciones", label: "Peticiones", icon: IconMessage2, roles: ["jefe_local", "admin_local"] },
  { href: "/equipo", label: "Equipo", icon: IconUsers, roles: ["jefe_local", "admin_local"] },
  { href: "/plan", label: "Mi plan", icon: IconBadge, roles: ["jefe_local", "admin_local"] },
  { href: "/suscripcion", label: "Suscripción", icon: IconCreditCard, roles: ["admin_local"] },
  { href: "/soporte", label: "Soporte", icon: IconLifebuoy, roles: ["trabajador_local", "jefe_local", "admin_local"] },
  { href: "/mi-cuenta", label: "Cuenta", icon: IconUser, roles: ["trabajador_local", "jefe_local", "admin_local"] },
];

const BOTTOM_ITEMS: BottomNavItem[] = [
  ...TRABAJADOR_ITEMS,
  ...DUENO_ITEMS,
  { href: "/", label: "Cartera", icon: IconLayoutDashboard, roles: ["asesor", "admin_nucleo"] },
  { href: "/calendario", label: "Agenda", icon: IconCalendarEvent, roles: ["asesor", "admin_nucleo"] },
  { href: "/visitas", label: "Visitas", icon: IconMapPin, roles: ["asesor", "admin_nucleo"] },
  { href: "/sellos", label: "Sellos", icon: IconMedal, roles: ["asesor", "admin_nucleo"] },
  { href: "/comunicaciones", label: "Peticiones", icon: IconMessage2, roles: ["asesor", "admin_nucleo"] },
];

const ADMIN_BOTTOM_ITEMS: BottomNavItem[] = [
  { href: "/admin", label: "Resumen", icon: IconLayoutDashboard, roles: ["admin_nucleo"] },
  { href: "/admin/locales", label: "Locales", icon: IconBuildingStore, roles: ["admin_nucleo"] },
  { href: "/calendario", label: "Agenda", icon: IconCalendarEvent, roles: ["admin_nucleo"] },
  { href: "/comunicaciones", label: "Peticiones", icon: IconMessage2, roles: ["admin_nucleo"] },
  { href: "/admin/pagos", label: "Pagos", icon: IconCreditCard, roles: ["admin_nucleo"] },
];

const ASESOR_BOTTOM_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Cartera", icon: IconLayoutDashboard, roles: ["asesor", "admin_nucleo"] },
  { href: "/calendario", label: "Agenda", icon: IconCalendarEvent, roles: ["asesor", "admin_nucleo"] },
  { href: "/visitas", label: "Visitas", icon: IconMapPin, roles: ["asesor", "admin_nucleo"] },
  { href: "/hallazgos", label: "Hallazgos", icon: IconChecklist, roles: ["asesor", "admin_nucleo"] },
  { href: "/mi-cuenta", label: "Cuenta", icon: IconUser, roles: ["asesor", "admin_nucleo"] },
];

interface BottomNavProps {
  userRole: UserRole | null;
  mode?: "dashboard" | "admin" | "asesor";
  planId?: PlanId;
}

function Tab({ item, pathname }: { item: BottomNavItem; pathname: string }) {
  const isActive = item.href === "/" || item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`tab flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-bold ${
        isActive ? "text-[#2F6B2A]" : "text-[#5B6980]"
      }`}
    >
      <Icon size={24} />
      <span className="max-w-full truncate px-0.5">{item.label}</span>
    </Link>
  );
}

export function BottomNav({ userRole, mode = "dashboard", planId }: BottomNavProps) {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);

  const sourceItems =
    mode === "admin" ? ADMIN_BOTTOM_ITEMS : mode === "asesor" ? ASESOR_BOTTOM_ITEMS : BOTTOM_ITEMS;
  const visibleItems = sourceItems.filter((item) => userRole && item.roles.includes(userRole));
  const mas =
    mode === "dashboard"
      ? MAS_LOCAL.filter(
          (item) => userRole && item.roles.includes(userRole) && (!item.modulo || planIncluye(planId, item.modulo))
        )
      : [];

  return (
    <>
      {masAbierto && mas.length > 0 && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0B1B33]/40" onClick={() => setMasAbierto(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 pb-8 border-t border-[#DDE3EA]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-extrabold text-[#0B1B33]">Más</p>
              <button type="button" aria-label="Cerrar" onClick={() => setMasAbierto(false)} className="w-12 h-12 flex items-center justify-center">
                <IconX size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mas.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMasAbierto(false)}
                    className="flex items-center gap-2 min-h-12 px-3 rounded-xl border border-[#DDE3EA] font-bold text-sm text-[#0B1B33]"
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <nav aria-label="Principal" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#DDE3EA] pb-3 flex">
        {visibleItems.map((item) => (
          <Tab key={item.href} item={item} pathname={pathname} />
        ))}
        {mas.length > 0 && (
          <button
            type="button"
            onClick={() => setMasAbierto(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-bold text-[#5B6980]"
          >
            <IconDots size={24} />
            Más
          </button>
        )}
      </nav>
    </>
  );
}
