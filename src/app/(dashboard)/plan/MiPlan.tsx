"use client";

import Link from "next/link";
import { IconCheck, IconLock, IconCircleDashed } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { PlanBadge } from "@/components/plan/PlanBadge";
import {
  PLANES,
  TIPO_LOCAL_LABEL,
  estadoContrato,
  DECLARACIONES_VU_ANUALES,
} from "@/lib/planes";
import { formatCLP, formatDate, formatPeriodo } from "@/lib/utils";

const NIVEL_LABEL: Record<string, string> = {
  inicial: "Inicial",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  premium: "Premium",
};

function Estado({ hecho, texto, detalle }: { hecho: boolean; texto: string; detalle: string }) {
  return (
    <li className="flex items-start gap-3 py-3 border-b border-[#F1F5F9] last:border-0">
      {hecho ? (
        <IconCheck size={18} className="mt-0.5 text-[#2F6B2A] shrink-0" aria-hidden />
      ) : (
        <IconCircleDashed size={18} className="mt-0.5 text-[#5B6980] shrink-0" aria-hidden />
      )}
      <div>
        <p className="text-sm font-medium text-[#0B1B33]">{texto}</p>
        <p className="text-xs text-[#5B6980]">{detalle}</p>
      </div>
    </li>
  );
}

export function MiPlan({ puedeVerPagos }: { puedeVerPagos: boolean }) {
  const resumen = trpc.plan.resumen.useQuery();

  if (resumen.isLoading) return <p className="text-sm text-[#5B6980]">Cargando tu plan…</p>;
  if (resumen.error || !resumen.data) {
    return (
      <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2">
        {resumen.error?.message ?? "No pudimos cargar el plan de este local."}
      </p>
    );
  }

  const datos = resumen.data;
  const definicion = PLANES[datos.plan];
  const noIncluidos =
    datos.plan === "calidad" ? PLANES.integral.beneficios.filter((beneficio) => beneficio.modulo) : [];
  const hasta = datos.contrato.hasta ? new Date(datos.contrato.hasta) : null;
  const { estado: estadoDelContrato, dias } = estadoContrato(hasta);
  const porVencer = estadoDelContrato === "por_vencer" || estadoDelContrato === "vencido";
  const mes = datos.servicioDelMes;
  const visitaFecha = mes.visita.fecha ? new Date(mes.visita.fecha) : null;
  const proxima = mes.visita.proxima ? new Date(mes.visita.proxima) : null;
  const capacitacion = mes.capacitacion.fecha ? new Date(mes.capacitacion.fecha) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Mi plan</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            {datos.localNombre} · {TIPO_LOCAL_LABEL[datos.tipoLocal]}
          </p>
        </div>
        <PlanBadge plan={datos.plan} />
      </div>

      <ScoreCards
        items={[
          {
            label: "Plan",
            value: definicion.nombre.replace("Plan ", ""),
            hint: formatCLP(datos.contrato.montoMensual ?? definicion.precio) + " al mes",
            tone: "neutral",
          },
          {
            label: "Contrato",
            value: hasta ? formatDate(hasta) : "Sin definir",
            hint: hasta ? (porVencer ? (dias! < 0 ? "Vencido" : `Vence en ${dias} días`) : "Vigente") : "Lo define casa central",
            tone: porVencer ? "alerta" : "neutral",
          },
          {
            label: "Visita del mes",
            value: visitaFecha ? "Hecha" : "Pendiente",
            hint: visitaFecha ? formatDate(visitaFecha) : proxima ? `Agendada ${formatDate(proxima)}` : formatPeriodo(mes.periodo),
            tone: visitaFecha ? "ok" : "alerta",
          },
          {
            label: "Sello del mes",
            value: mes.sello ? (NIVEL_LABEL[mes.sello.nivel] ?? mes.sello.nivel) : "Sin emitir",
            hint: mes.sello ? `${Math.round(mes.sello.puntaje)}% de cumplimiento` : "Lo emite tu asesor",
            tone: mes.sello ? "ok" : "neutral",
          },
        ]}
      />

      {porVencer && hasta && (
        <div className="rounded-xl border border-[#E3B341] bg-[#FFF8E6] px-4 py-3 text-sm text-[#5B3B00]">
          {dias! < 0
            ? "El contrato anual venció. Habla con tu asesor para renovarlo."
            : `El contrato anual vence el ${formatDate(hasta)}. Habla con tu asesor para renovarlo.`}
          {puedeVerPagos && (
            <Link href="/suscripcion" className="ml-2 underline font-medium">
              Ver suscripción
            </Link>
          )}
        </div>
      )}

      <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#0B1B33]">Servicio de {formatPeriodo(mes.periodo)}</h2>
        <ul className="mt-2">
          <Estado
            hecho={Boolean(visitaFecha)}
            texto="Visita presencial"
            detalle={visitaFecha ? `Realizada el ${formatDate(visitaFecha)}` : proxima ? `Agendada para el ${formatDate(proxima)}` : "Aún sin fecha este mes"}
          />
          <Estado
            hecho={Boolean(capacitacion)}
            texto="Capacitación mensual"
            detalle={capacitacion ? `Registrada el ${formatDate(capacitacion)}` : "Sin registro este mes"}
          />
          <Estado
            hecho={mes.documentos.total > 0 && mes.documentos.revisados === mes.documentos.total}
            texto="Revisión de documentos"
            detalle={
              mes.documentos.total === 0
                ? "Sin documentos cargados este mes"
                : `${mes.documentos.revisados} de ${mes.documentos.total} revisados por tu asesor`
            }
          />
          <Estado
            hecho={Boolean(mes.sello)}
            texto="Informe y sello mensual"
            detalle={mes.sello ? `Emitido el ${formatDate(mes.sello.emitidoAt)}` : "Se emite al cierre del mes"}
          />
          {datos.ambiental && (
            <>
              <Estado
                hecho={datos.ambiental.declaraciones > 0}
                texto="Declaraciones en Ventanilla Única"
                detalle={`${datos.ambiental.declaraciones} de ${DECLARACIONES_VU_ANUALES} en este año de contrato`}
              />
              <Estado
                hecho={datos.ambiental.charlasMes > 0}
                texto="Charla ambiental"
                detalle={datos.ambiental.charlasMes > 0 ? `${datos.ambiental.charlasMes} este mes` : "Sin charla este mes"}
              />
            </>
          )}
        </ul>
        {datos.ambiental && (
          <Link href="/ambiental" className="mt-2 inline-block text-sm font-medium text-[#255620] underline">
            Ver gestión ambiental
          </Link>
        )}
      </section>

      <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#0B1B33]">Qué incluye tu plan</h2>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {definicion.beneficios.map((beneficio) => (
            <li key={beneficio.texto} className="flex items-start gap-2 text-sm text-[#334155]">
              <IconCheck size={16} className="mt-0.5 text-[#2F6B2A] shrink-0" aria-hidden />
              {beneficio.texto}
            </li>
          ))}
        </ul>
        {noIncluidos.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-semibold text-[#5B6980]">Incluido en el {PLANES.integral.nombre}</h3>
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {noIncluidos.map((beneficio) => (
                <li key={beneficio.texto} className="flex items-start gap-2 text-sm text-[#5B6980]">
                  <IconLock size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {beneficio.texto}
                </li>
              ))}
            </ul>
            <Link
              href="/comunicaciones"
              className="mt-4 inline-flex items-center min-h-10 px-4 rounded-lg border border-[#DDE3EA] text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
            >
              Consultar el cambio de plan con tu asesor
            </Link>
          </>
        )}
      </section>

      <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#0B1B33]">Tu asesor</h2>
        {datos.asesor ? (
          <p className="mt-1 text-sm text-[#334155]">
            {datos.asesor.nombre} · {datos.asesor.email}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[#5B6980]">Este local aún no tiene un asesor asignado.</p>
        )}
        <Link href="/soporte" className="mt-2 inline-block text-sm font-medium text-[#255620] underline">
          Ir a Soporte
        </Link>
      </section>
    </div>
  );
}
