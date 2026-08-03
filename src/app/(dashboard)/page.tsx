import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { getCaller } from "@/lib/trpc/server";
import { SelloWidget } from "@/components/dashboard/SelloWidget";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AlertasPanel } from "@/components/dashboard/AlertasPanel";
import { getCurrentPeriodo, formatDate } from "@/lib/utils";
import { DashboardChart } from "./DashboardChart";
import {
  IconClipboardList,
  IconFileDescription,
  IconSchool,
  IconMedal,
  IconAlertTriangle,
  IconThermometer,
  IconChecklist,
  IconChartBar,
  IconBuildingStore,
  IconMapPin,
  IconArrowRight,
} from "@tabler/icons-react";
import type { UserRole } from "@/server/trpc/context";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const cookieStore = await cookies();
  const tenantActivoCookie = cookieStore.get("tenant_activo")?.value;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true, nombre: true },
  });

  const userRole = (dbUser?.rol as UserRole | undefined) ?? null;

  // admin_nucleo puede acceder a cualquier tenant — usar misma lógica que el layout
  let allLocales: { id: string; nombre: string }[];
  if (userRole === "admin_nucleo") {
    allLocales = await prisma.tenant.findMany({
      where: { estado: "activo" },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  } else {
    const userTenants = await prisma.userTenant.findMany({
      where: { user_id: user.id },
      include: { tenant: { select: { id: true, nombre: true } } },
    });
    allLocales = userTenants.map((ut) => ut.tenant);
  }

  const tenantActivo =
    tenantActivoCookie && allLocales.some((l) => l.id === tenantActivoCookie)
      ? tenantActivoCookie
      : allLocales[0]?.id ?? null;

  const tenantNombre =
    allLocales.find((l) => l.id === tenantActivo)?.nombre ?? "Mi local";

  // trabajador_local: vista centrada en tareas del día
  if (userRole === "trabajador_local") {
    const caller = await getCaller();
    const tareasRaw = await caller.tareas.list({}).catch(() => []);
    const tareaResumen = {
      tareas: tareasRaw.map((t: { id: string; titulo: string; completaciones: Array<unknown> }) => ({
        id: t.id,
        titulo: t.titulo,
        completada: t.completaciones.length > 0,
      })),
      completadas: tareasRaw.filter((t: { completaciones: Array<unknown> }) => t.completaciones.length > 0).length,
      total: tareasRaw.length,
    };
    return <TrabajadorDashboard tenantNombre={tenantNombre} userName={dbUser?.nombre} tareas={tareaResumen} />;
  }

  // asesor: dashboard con acceso rápido a informes + KPIs del local activo
  const caller = await getCaller();

  const [selloActual, historial, registros, documentos] = await Promise.allSettled([
    caller.sellos.getActual({}),
    caller.sellos.getHistorial({ limit: 6 }),
    caller.registros.list({ limit: 100 }),
    caller.documentos.list({}),
  ]);

  const sello = selloActual.status === "fulfilled" ? selloActual.value : null;
  const historialData = historial.status === "fulfilled" ? historial.value : [];
  const registrosData = registros.status === "fulfilled" ? registros.value : [];
  const documentosData = documentos.status === "fulfilled" ? documentos.value : [];

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const registrosMes = registrosData.filter(
    (r: { fecha: Date }) => new Date(r.fecha) >= inicioMes
  ).length;

  const docsPendientes = documentosData.filter(
    (d: { estado: string }) => d.estado === "pendiente"
  ).length;
  const docsObservados = documentosData.filter(
    (d: { estado: string }) => d.estado === "observado"
  ).length;
  const docsVencidos = documentosData.filter((d: { estado: string; vencimiento?: Date | null }) => {
    if (!d.vencimiento) return false;
    return new Date(d.vencimiento) < hoy;
  }).length;

  const periodoActual = getCurrentPeriodo();

  const chartData = [...historialData]
    .reverse()
    .map((s: { periodo: string; score_general: number; nivel: string }) => ({
      periodo: s.periodo,
      score: s.score_general,
      nivel: s.nivel,
    }));

  const alertas = [
    ...(docsVencidos > 0
      ? [{ id: "docs-vencidos", tipo: "vencido" as const, mensaje: `${docsVencidos} documento${docsVencidos > 1 ? "s" : ""} vencido${docsVencidos > 1 ? "s" : ""}`, href: "/documentos" }]
      : []),
    ...(docsObservados > 0
      ? [{ id: "docs-obs", tipo: "proximo" as const, mensaje: `${docsObservados} documento${docsObservados > 1 ? "s" : ""} con observaciones`, href: "/documentos" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">{tenantNombre}</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Resumen de cumplimiento — {periodoActual}
          </p>
        </div>
        {/* Acceso rápido a informes para asesor/admin_nucleo */}
        {(userRole === "asesor" || userRole === "admin_nucleo") && (
          <Link
            href={userRole === "asesor" ? "/asesor/informes" : "/admin/informes"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D2137] text-white text-sm font-medium hover:bg-[#143556] transition-colors shrink-0"
          >
            <IconChartBar size={16} />
            <span className="hidden sm:inline">Informes</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {sello ? (
            <Link href="/sellos" className="block hover:opacity-90 transition-opacity h-full">
              <SelloWidget
                nivel={sello.nivel as "inicial" | "intermedio" | "avanzado" | "premium"}
                score={sello.score_general}
                periodo={sello.periodo}
                planMejoras={(sello.plan_mejoras ?? []) as string[]}
                descargosHabilitados={sello.descargos_habilitados ?? false}
              />
            </Link>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] bg-white p-8 text-center flex flex-col items-center justify-center gap-3 h-full min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-[#EBF5E6] flex items-center justify-center">
                <IconMedal size={24} className="text-[#4B8B2E]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0B2545]">
                  Sin sello para {periodoActual}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  {userRole === "asesor" || userRole === "admin_nucleo"
                    ? "Ve a Sellos para emitirlo."
                    : "Tu asesor lo emitirá al cierre del mes."}
                </p>
              </div>
              {(userRole === "asesor" || userRole === "admin_nucleo") && (
                <Link
                  href="/sellos"
                  className="text-xs font-medium text-[#4B8B2E] hover:underline"
                >
                  Emitir sello →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Link href="/registros">
            <KpiCard
              title="Registros este mes"
              value={registrosMes}
              icon={IconClipboardList}
              description={`${registrosData.length} total en el período`}
              trend="neutral"
            />
          </Link>
          <Link href="/documentos">
            <KpiCard
              title="Docs. pendientes"
              value={docsPendientes}
              icon={IconFileDescription}
              trend={docsPendientes > 0 ? "down" : "up"}
              description={docsPendientes > 0 ? "Requieren atención" : "Todo al día ✓"}
            />
          </Link>
          <Link href="/documentos">
            <KpiCard
              title="Docs. observados"
              value={docsObservados}
              icon={IconAlertTriangle}
              trend={docsObservados > 0 ? "down" : "neutral"}
              description={docsObservados > 0 ? "Requieren corrección" : "Sin observaciones"}
            />
          </Link>
          {(userRole === "asesor" || userRole === "admin_nucleo") ? (
            <Link href="/visitas">
              <KpiCard
                title="Visitas"
                value="Ver"
                icon={IconMapPin}
                description="Historial de visitas"
                trend="neutral"
              />
            </Link>
          ) : (
            <Link href="/capacitaciones">
              <KpiCard
                title="Capacitaciones"
                value="Ver"
                icon={IconSchool}
                description="Historial de capacitaciones"
                trend="neutral"
              />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {chartData.length >= 2 && (
          <div className="lg:col-span-2">
            <DashboardChart data={chartData} />
          </div>
        )}
        <div className={chartData.length >= 2 ? "lg:col-span-1" : "lg:col-span-3"}>
          <AlertasPanel alertas={alertas} />
        </div>
      </div>

      {registrosData.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#0B2545]">Últimos registros BPM</p>
            <Link
              href="/registros"
              className="text-xs text-[#4B8B2E] hover:underline font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-0">
            {registrosData
              .slice(0, 5)
              .map((r: { id: string; tipo: string; fecha: Date; estado: string }) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <IconThermometer size={14} className="text-[#64748B]" />
                    <span className="text-sm capitalize text-[#0B2545]">{r.tipo}</span>
                  </div>
                  <span className="text-xs text-[#64748B]">{formatDate(r.fecha)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

type TareaResumen = { tareas: Array<{ id: string; titulo: string; completada: boolean }>; completadas: number; total: number };

function TrabajadorDashboard({
  tenantNombre,
  userName,
  tareas,
}: {
  tenantNombre: string;
  userName?: string;
  tareas: TareaResumen;
}) {
  const pct = tareas.total > 0 ? Math.round((tareas.completadas / tareas.total) * 100) : 0;
  const hoy = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545]">
          Hola{userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-[#64748B] mt-1 capitalize">{hoy} · {tenantNombre}</p>
      </div>

      {/* Progreso del día */}
      {tareas.total > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IconChecklist size={18} className="text-[#4B8B2E]" />
              <span className="font-semibold text-[#0B2545] text-sm">Tareas de hoy</span>
            </div>
            <span className="text-sm font-bold text-[#0B2545]">
              {tareas.completadas}/{tareas.total}
            </span>
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-2 mb-3">
            <div
              className="h-2 rounded-full bg-[#4B8B2E] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <Link
            href="/tareas"
            className="flex items-center justify-between text-sm text-[#4B8B2E] font-medium hover:underline"
          >
            <span>{pct === 100 ? "¡Todas completadas!" : `${pct}% completado`}</span>
            <span className="flex items-center gap-1">Ver tareas <IconArrowRight size={14} /></span>
          </Link>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/tareas">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:border-[#4B8B2E]/40 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#EBF5E6] flex items-center justify-center mb-3">
              <IconChecklist size={24} className="text-[#4B8B2E]" />
            </div>
            <p className="font-semibold text-[#0B2545]">Mis Tareas</p>
            <p className="text-sm text-[#64748B] mt-1">Checklist diario del turno</p>
          </div>
        </Link>

        <Link href="/registros">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:border-[#4B8B2E]/40 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <IconThermometer size={24} className="text-blue-600" />
            </div>
            <p className="font-semibold text-[#0B2545]">Registros BPM</p>
            <p className="text-sm text-[#64748B] mt-1">Temperatura, limpieza y más</p>
          </div>
        </Link>

        <Link href="/capacitaciones">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:border-[#4B8B2E]/40 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
              <IconSchool size={24} className="text-purple-600" />
            </div>
            <p className="font-semibold text-[#0B2545]">Capacitaciones</p>
            <p className="text-sm text-[#64748B] mt-1">Ver mis capacitaciones</p>
          </div>
        </Link>

        <Link href="/mi-cuenta">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:border-[#4B8B2E]/40 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <IconBuildingStore size={24} className="text-orange-600" />
            </div>
            <p className="font-semibold text-[#0B2545]">Mi Cuenta</p>
            <p className="text-sm text-[#64748B] mt-1">Datos personales y ARSOPB</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
