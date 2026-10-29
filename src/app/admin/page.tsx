import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import {
  IconBuildingStore,
  IconUserCheck,
  IconShield,
  IconSettings,
  IconArrowRight,
  IconMedal,
  IconCreditCard,
  IconAlertTriangle,
  IconMapPin,
  IconThermometer,
} from "@tabler/icons-react";
import { formatCLP, formatDate } from "@/lib/utils";
import { cargarPanelOperativo } from "@/server/admin/panelOperativo";
import { PanelOperativo } from "./PanelOperativo";

export default async function AdminPage() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const periodoActual = hoy.toISOString().slice(0, 7);

  const [
    totalLocales,
    totalAsesores,
    solicitudesPendientes,
    morosos,
    sellosEsteMes,
    pagosMes,
    revisionesPendientes,
    actividadReciente,
  ] = await Promise.all([
    prisma.tenant.count({ where: { estado: "activo" } }),
    prisma.user.count({ where: { rol: "asesor", activo: true } }),
    prisma.solicitudArsopb.count({ where: { estado: "pendiente" } }),
    prisma.suscripcion.count({ where: { estado: "morosa" } }),
    prisma.sello.count({ where: { emitido_at: { gte: inicioMes } } }),
    prisma.pago.aggregate({
      where: { periodo: periodoActual, estado: "pagado" },
      _sum: { monto_clp: true },
      _count: true,
    }),
    prisma.revisionSello.count({ where: { estado: "pendiente" } }),
    // Actividad reciente: últimos sellos + visitas
    Promise.all([
      prisma.sello.findMany({
        take: 5,
        orderBy: { emitido_at: "desc" },
        include: { tenant: { select: { nombre: true } } },
      }),
      prisma.visita.findMany({
        where: { estado: "realizada" },
        take: 5,
        orderBy: { fecha: "desc" },
        include: { tenant: { select: { nombre: true } } },
      }),
    ]),
  ]);

  const [sellosRecientes, visitasRecientes] = actividadReciente;
  const panelOperativo = await cargarPanelOperativo(prisma);
  const ingresosMes = pagosMes._sum.monto_clp ?? 0;

  const kpis = [
    {
      href: "/admin/locales",
      icon: IconBuildingStore,
      title: "Locales activos",
      value: totalLocales,
      color: "text-[#2F6B2A]",
      bg: "bg-[#E5F1E3]",
      badge: null,
    },
    {
      href: "/admin/asesores",
      icon: IconUserCheck,
      title: "Asesores",
      value: totalAsesores,
      color: "text-[#16294A]",
      bg: "bg-blue-50",
      badge: null,
    },
    {
      href: "/admin/pagos",
      icon: IconAlertTriangle,
      title: "Suscripciones morosas",
      value: morosos,
      color: morosos > 0 ? "text-[#B42318]" : "text-[#2F6B2A]",
      bg: morosos > 0 ? "bg-red-100" : "bg-[#E5F1E3]",
      badge: morosos > 0 ? `${morosos} pendiente${morosos > 1 ? "s" : ""}` : null,
    },
    {
      href: "/admin/arsopb",
      icon: IconShield,
      title: "ARSOPB pendientes",
      value: solicitudesPendientes,
      color: solicitudesPendientes > 0 ? "text-amber-600" : "text-[#2F6B2A]",
      bg: solicitudesPendientes > 0 ? "bg-amber-50" : "bg-[#E5F1E3]",
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Panel Administración</h1>
        <p className="text-sm text-[#5B6980] mt-1">Gestión global de Nucleo 24H</p>
      </div>

      {/* KPI cards principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.href}
              href={kpi.href}
              className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <Icon size={18} className={kpi.color} />
                </div>
                <IconArrowRight size={14} className="text-[#DDE3EA] group-hover:text-[#2F6B2A] transition-colors" />
              </div>
              <p className="text-2xl font-bold text-[#0B1B33]">{kpi.value}</p>
              <p className="text-xs text-[#5B6980] mt-1">{kpi.title}</p>
              {kpi.badge && (
                <span className="mt-2 inline-block text-[10px] font-medium bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                  {kpi.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* KPIs secundarios: sellos y pagos del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <IconMedal size={18} className="text-[#2F6B2A]" />
            <p className="text-sm font-semibold text-[#0B1B33]">Sellos este mes</p>
          </div>
          <p className="text-3xl font-bold text-[#0B1B33]">{sellosEsteMes}</p>
          <p className="text-xs text-[#5B6980] mt-1">
            de {totalLocales} local{totalLocales !== 1 ? "es" : ""}
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-[#DDE3EA] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2F6B2A]"
              style={{ width: `${totalLocales ? Math.min(100, (sellosEsteMes / totalLocales) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <IconCreditCard size={18} className="text-[#16294A]" />
            <p className="text-sm font-semibold text-[#0B1B33]">Ingresos este mes</p>
          </div>
          <p className="text-3xl font-bold text-[#0B1B33]">{formatCLP(ingresosMes)}</p>
          <p className="text-xs text-[#5B6980] mt-1">{pagosMes._count} pago{pagosMes._count !== 1 ? "s" : ""} confirmado{pagosMes._count !== 1 ? "s" : ""}</p>
        </div>

        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <IconShield size={18} className="text-amber-500" />
            <p className="text-sm font-semibold text-[#0B1B33]">Revisiones de sello</p>
          </div>
          <p className="text-3xl font-bold text-[#0B1B33]">{revisionesPendientes}</p>
          <p className="text-xs text-[#5B6980] mt-1">pendiente{revisionesPendientes !== 1 ? "s" : ""} de responder</p>
          {revisionesPendientes > 0 && (
            <Link
              href="/sellos"
              className="mt-3 text-xs text-amber-600 hover:underline font-medium"
            >
              Ir a responder →
            </Link>
          )}
        </div>
      </div>

      <PanelOperativo panel={panelOperativo} />

      {/* Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimos sellos */}
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconMedal size={16} className="text-[#2F6B2A]" />
              <p className="text-sm font-semibold text-[#0B1B33]">Últimos sellos emitidos</p>
            </div>
            <Link href="/admin/informes" className="text-xs text-[#2F6B2A] hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          {sellosRecientes.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-4">Sin sellos emitidos aún.</p>
          ) : (
            <div className="space-y-0 divide-y divide-[#F1F5F9]">
              {sellosRecientes.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBuildingStore size={13} className="text-[#5B6980] shrink-0" />
                    <span className="text-[#334155] truncate">{s.tenant.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-[#5B6980]">{s.periodo}</span>
                    <NivelBadge nivel={s.nivel} score={s.score_general} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas visitas */}
        <div className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconMapPin size={16} className="text-[#16294A]" />
              <p className="text-sm font-semibold text-[#0B1B33]">Últimas visitas</p>
            </div>
            <Link href="/visitas" className="text-xs text-[#2F6B2A] hover:underline font-medium">
              Ver todas →
            </Link>
          </div>
          {visitasRecientes.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-4">Sin visitas registradas aún.</p>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {visitasRecientes.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconThermometer size={13} className="text-[#5B6980] shrink-0" />
                    <span className="text-[#334155] truncate">{v.tenant.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs capitalize text-[#5B6980]">{v.tipo}</span>
                    <span className="text-xs text-[#94A3B8]">{formatDate(v.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accesos rápidos secundarios */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/admin/informes", icon: IconUserCheck, label: "Informes", desc: "Resumen por local" },
          { href: "/admin/pagos", icon: IconCreditCard, label: "Pagos", desc: "Historial y gestión" },
          { href: "/admin/configuracion", icon: IconSettings, label: "Configuración", desc: "Pesos del sello" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl border border-[#DDE3EA] p-4 hover:shadow-sm transition-shadow group flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#F4F6F3] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[#5B6980] group-hover:text-[#2F6B2A] transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0B1B33]">{item.label}</p>
                <p className="text-xs text-[#5B6980] truncate">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NivelBadge({ nivel, score }: { nivel: string; score: number }) {
  const config: Record<string, string> = {
    inicial: "bg-red-100 text-red-700",
    intermedio: "bg-yellow-100 text-yellow-700",
    avanzado: "bg-blue-100 text-blue-700",
    premium: "bg-[#E5F1E3] text-[#255620]",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config[nivel] ?? "bg-gray-100 text-gray-600"}`}>
      {Math.round(score)}%
    </span>
  );
}
