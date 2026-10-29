import Link from "next/link";
import {
  IconThermometer,
  IconFileDescription,
  IconMedal,
  IconCalendarEvent,
  IconMapPin,
  IconMessage2,
  IconCreditCard,
  IconLeaf,
  IconClipboardCheck,
  IconGavel,
} from "@tabler/icons-react";
import type { UserRole } from "@/server/trpc/context";
import { planIncluye } from "@/lib/planes";

type Acceso = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

function accesosPara(rol: UserRole, plan: unknown): Acceso[] {
  if (rol === "asesor" || rol === "admin_nucleo") {
    return [
      { href: "/registros", label: "Registros", icon: IconThermometer },
      { href: "/visitas", label: "Visitas", icon: IconMapPin },
      { href: "/calendario", label: "Calendario", icon: IconCalendarEvent },
      { href: "/programa", label: "Programa", icon: IconClipboardCheck },
      { href: "/sellos", label: "Sellos", icon: IconMedal },
      { href: "/comunicaciones", label: "Mensajes", icon: IconMessage2 },
    ];
  }

  const accesos: Acceso[] = [
    { href: "/registros", label: "Registros", icon: IconThermometer },
    { href: "/documentos", label: "Documentos", icon: IconFileDescription },
    { href: "/sellos", label: "Sello", icon: IconMedal },
    { href: "/calendario", label: "Calendario", icon: IconCalendarEvent },
    { href: "/fiscalizaciones", label: "Fiscalizaciones", icon: IconGavel },
    { href: "/comunicaciones", label: "Mensajes", icon: IconMessage2 },
  ];
  if (planIncluye(plan, "ambiental")) {
    accesos.push({ href: "/ambiental", label: "Ambiental", icon: IconLeaf });
  }
  if (rol === "admin_local") {
    accesos.push({ href: "/suscripcion", label: "Suscripción", icon: IconCreditCard });
  }
  return accesos;
}

export function AccesosRapidos({ rol, plan }: { rol: UserRole; plan: unknown }) {
  return (
    <nav aria-label="Accesos rápidos">
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {accesosPara(rol, plan).map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-[72px] flex-col items-start justify-between gap-2 rounded-[14px] border border-[#DDE3EA] bg-white px-4 py-3 text-sm font-bold text-[#0B1B33] transition-colors hover:border-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
            >
              <Icon size={22} className="text-[#2F6B2A]" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
