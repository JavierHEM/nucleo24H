"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { formatCLP } from "@/lib/utils";
import { LocalSelector } from "./LocalSelector";
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
  IconDots,
  IconClipboardCheck,
  IconCalendarEvent,
  IconLeaf,
  IconGavel,
  IconLifebuoy,
  IconBadge,
} from "@tabler/icons-react";
import type { UserRole } from "@/server/trpc/context";
import { PlanBadge } from "@/components/plan/PlanBadge";
import { planIncluye, type ModuloPlan, type PlanId } from "@/lib/planes";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
  active?: string[];
  modulo?: ModuloPlan;
}

const LOCAL_PRIMARIOS: NavItem[] = [
  { href: "/", label: "Hoy", icon: IconLayoutDashboard, roles: ["trabajador_local", "jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/registros", label: "Registros", icon: IconThermometer, roles: ["trabajador_local", "jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/documentos", label: "Documentos", icon: IconFileDescription, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/programa", label: "Programa", icon: IconClipboardCheck, roles: ["asesor", "admin_nucleo"] },
  { href: "/sellos", label: "Sello y visitas", icon: IconMedal, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"], active: ["/sellos", "/visitas"] },
  { href: "/equipo", label: "Equipo y cuenta", icon: IconUsers, roles: ["jefe_local", "admin_local", "admin_nucleo"], active: ["/equipo", "/mi-cuenta", "/suscripcion", "/comunicaciones"] },
  { href: "/mi-cuenta", label: "Cuenta", icon: IconUser, roles: ["trabajador_local"] },
];

const LOCAL_MAS: NavItem[] = [
  { href: "/plan", label: "Mi plan", icon: IconBadge, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/calendario", label: "Calendario", icon: IconCalendarEvent, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/ambiental", label: "Gestión ambiental", icon: IconLeaf, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"], modulo: "ambiental" },
  { href: "/fiscalizaciones", label: "Fiscalizaciones", icon: IconGavel, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/tareas", label: "Tareas", icon: IconChecklist, roles: ["trabajador_local", "jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/capacitaciones", label: "Capacitaciones", icon: IconSchool, roles: ["trabajador_local", "jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/visitas", label: "Visitas", icon: IconMapPin, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/comunicaciones", label: "Mensajes", icon: IconMessage2, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/suscripcion", label: "Suscripción", icon: IconCreditCard, roles: ["admin_local", "admin_nucleo"] },
  { href: "/soporte", label: "Soporte", icon: IconLifebuoy, roles: ["trabajador_local", "jefe_local", "admin_local", "asesor", "admin_nucleo"] },
  { href: "/mi-cuenta", label: "Mi cuenta", icon: IconUser, roles: ["jefe_local", "admin_local", "asesor", "admin_nucleo"] },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: IconLayoutDashboard, roles: ["admin_nucleo"] },
  { href: "/admin/locales", label: "Locales", icon: IconBuildingStore, roles: ["admin_nucleo"] },
  { href: "/programa", label: "Programa", icon: IconClipboardCheck, roles: ["admin_nucleo"] },
  { href: "/admin/asesores", label: "Asesores", icon: IconUserCheck, roles: ["admin_nucleo"] },
  { href: "/admin/pagos", label: "Pagos", icon: IconCreditCard, roles: ["admin_nucleo"] },
  { href: "/admin/arsopb", label: "ARSOPB", icon: IconShield, roles: ["admin_nucleo"] },
  { href: "/admin/informes", label: "Informes", icon: IconChartBar, roles: ["admin_nucleo"] },
  { href: "/admin/configuracion", label: "Configuración", icon: IconSettings, roles: ["admin_nucleo"] },
];

const ASESOR_ITEMS: NavItem[] = [
  { href: "/", label: "Cartera", icon: IconLayoutDashboard, roles: ["asesor", "admin_nucleo"] },
  { href: "/programa", label: "Programa", icon: IconClipboardCheck, roles: ["asesor", "admin_nucleo"] },
  { href: "/visitas", label: "Visitas", icon: IconMapPin, roles: ["asesor", "admin_nucleo"] },
  { href: "/sellos", label: "Sellos por revisar", icon: IconMedal, roles: ["asesor", "admin_nucleo"] },
  { href: "/asesor/informes", label: "Informes", icon: IconChartBar, roles: ["asesor", "admin_nucleo"] },
  { href: "/comunicaciones", label: "Mensajes", icon: IconMessage2, roles: ["asesor", "admin_nucleo"] },
  { href: "/mi-cuenta", label: "Mi cuenta", icon: IconUser, roles: ["asesor", "admin_nucleo"] },
];

function activo(item: NavItem, pathname: string) {
  const rutas = item.active ?? [item.href];
  return rutas.some((href) => (href === "/" || href === "/admin" ? pathname === href : pathname.startsWith(href)));
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = activo(item, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 min-h-12 px-3.5 rounded-[10px] text-[15px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341] ${
        isActive ? "bg-white text-[#0B1B33]" : "text-[#C9D3E3] hover:bg-[#16294A] hover:text-white"
      }`}
    >
      <Icon size={22} />
      {item.label}
    </Link>
  );
}

export interface PlanLocal {
  nombre: string;
  estado: string;
  monto: number;
  diaCobro: number;
}

interface Local {
  id: string;
  nombre: string;
}

interface SidebarProps {
  userRole: UserRole | null;
  mode?: "dashboard" | "admin" | "asesor";
  locales?: Local[];
  tenantActivo?: string;
  localNombre?: string;
  plan?: PlanLocal | null;
  planId?: PlanId;
}

const ESTADO_PLAN: Record<string, { label: string; className: string }> = {
  activa: { label: "Al día", className: "bg-[#E5F1E3] text-[#255620]" },
  morosa: { label: "Pago pendiente", className: "bg-[#FCF0D0] text-[#7A5000]" },
  suspendida: { label: "Suspendida", className: "bg-[#FCE4E1] text-[#9A1C12]" },
  cancelada: { label: "Cancelada", className: "bg-[#DDE3EA] text-[#41506A]" },
};

export function Sidebar({ userRole, mode = "dashboard", locales = [], tenantActivo, localNombre, plan, planId }: SidebarProps) {
  const pathname = usePathname();
  const catalogo = mode === "admin" ? ADMIN_ITEMS : mode === "asesor" ? ASESOR_ITEMS : LOCAL_PRIMARIOS;
  const visibles = (items: NavItem[]) =>
    items.filter(
      (item) => userRole && item.roles.includes(userRole) && (!item.modulo || planIncluye(planId, item.modulo))
    );
  const principales = visibles(catalogo);
  const mas = mode === "dashboard" ? visibles(LOCAL_MAS) : [];

  return (
    <aside className="hidden md:flex flex-col w-[272px] min-h-screen bg-[#0B1B33] text-white shrink-0 px-4 py-6 gap-6">
      <Link href="/" className="px-1.5 block" aria-label="Núcleo 24H, ir al inicio">
        <BrandLogo variant="negativo" className="w-44" priority />
      </Link>

      {mode === "dashboard" && (locales.length > 1 || localNombre) && (
        locales.length > 1 ? (
          <LocalSelector locales={locales} tenantActivo={tenantActivo} isAdmin={userRole === "admin_nucleo"} tone="dark" />
        ) : (
          <div className="flex flex-col gap-0.5 min-h-14 justify-center px-3.5 rounded-xl bg-[#16294A] border border-[#2A4068]">
            <span className="text-xs font-semibold text-[#9FB0CC]">Local activo</span>
            <span className="text-sm font-bold truncate">{localNombre}</span>
          </div>
        )
      )}

      {mode === "dashboard" && planId && (
        <div className="px-1.5 -mt-3">
          <PlanBadge plan={planId} tone="dark" />
        </div>
      )}

      {mode === "asesor" && (
        <div className="px-1.5">
          <p className="text-xs font-semibold text-[#9FB0CC]">Asesor</p>
          <p className="text-[15px] font-bold">Cartera del local activo</p>
        </div>
      )}

      <nav aria-label="Principal" className="flex flex-col gap-1">
        {principales.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {mas.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-3 min-h-12 px-3.5 rounded-[10px] text-[15px] font-bold text-[#C9D3E3] cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-[#16294A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341]">
            <IconDots size={22} />
            Más
          </summary>
          <div className="mt-1 flex flex-col gap-1">
            {mas.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </details>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {plan && userRole === "admin_local" && (
          <div className="rounded-xl bg-[#16294A] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">Plan {plan.nombre}</span>
              <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold ${ESTADO_PLAN[plan.estado]?.className ?? ESTADO_PLAN.activa.className}`}>
                {ESTADO_PLAN[plan.estado]?.label ?? plan.estado}
              </span>
            </div>
            <p className="text-[13px] leading-snug font-semibold text-[#9FB0CC]">
              Cobro el día {plan.diaCobro}. {formatCLP(plan.monto)} al mes.
            </p>
          </div>
        )}

        {(userRole === "admin_nucleo" || userRole === "asesor") && (
          <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
            {mode !== "dashboard" && (
              <Link href="/" className="flex items-center gap-3 min-h-12 px-3.5 rounded-[10px] text-sm font-bold text-[#C9D3E3] hover:bg-[#16294A]">
                <IconArrowLeft size={18} />
                Hoy
              </Link>
            )}
            {userRole === "asesor" && mode !== "asesor" && (
              <Link href="/asesor/informes" className="flex items-center gap-3 min-h-12 px-3.5 rounded-[10px] text-sm font-bold text-[#C9D3E3] hover:bg-[#16294A]">
                <IconChartBar size={18} />
                Informes
              </Link>
            )}
            {userRole === "admin_nucleo" && mode !== "admin" && (
              <Link href="/admin" className="flex items-center gap-3 min-h-12 px-3.5 rounded-[10px] text-sm font-bold text-[#C9D3E3] hover:bg-[#16294A]">
                <IconSettings size={18} />
                Panel Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
