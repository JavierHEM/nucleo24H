"use client";

import Link from "next/link";
import { useState } from "react";
import { IconLock, IconPaperclip } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ESTADO_DESCARGO_LABEL,
  RESULTADO_FISCALIZACION_LABEL,
  esEstadoDescargo,
  type ResultadoFiscalizacion,
} from "@/lib/descargos";
import { hrefArchivo } from "@/lib/storage/rutas";
import { formatDate } from "@/lib/utils";
import { FiscalizacionDialogo } from "./FiscalizacionDialogo";
import { DescargoDialogo } from "./DescargoDialogo";
import { DescargoGestion } from "./DescargoGestion";

const COLOR_ESTADO = {
  abierto: "bg-[#FFF8E6] text-[#5B3B00]",
  en_revision: "bg-[#E5F1E3] text-[#255620]",
  presentado: "bg-[#16294A] text-white",
  cerrado: "bg-[#DDE3EA] text-[#41506A]",
} as const;

export function FiscalizacionesVista({ esStaff, puedeAdjuntar }: { esStaff: boolean; puedeAdjuntar: boolean }) {
  const [registrando, setRegistrando] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const consulta = trpc.fiscalizaciones.resumen.useQuery();

  if (consulta.isLoading) return <p className="text-sm text-[#5B6980]">Cargando fiscalizaciones…</p>;
  if (consulta.error || !consulta.data) {
    return (
      <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2">
        {consulta.error?.message ?? "No pudimos cargar las fiscalizaciones."}
      </p>
    );
  }

  const { elegibilidad, fiscalizaciones, descargos } = consulta.data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Fiscalizaciones y descargos</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Registro de fiscalizaciones de la autoridad y solicitudes de descargo con tu asesor.
        </p>
      </div>

      {elegibilidad.habilitado ? (
        <section className="rounded-xl border border-[#2F6B2A] bg-[#E5F1E3] p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-[#255620]">Descargos gratuitos habilitados</p>
            <p className="text-sm text-[#255620]">Tu local tiene sello Premium. Tu asesor gestiona cada solicitud.</p>
          </div>
          <Button onClick={() => setSolicitando(true)} className="bg-[#2F6B2A] hover:bg-[#255620] text-white">
            Solicitar descargo
          </Button>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-[#DDE3EA] bg-white p-5 flex items-start gap-3">
          <IconLock size={22} className="mt-0.5 text-[#5B6980] shrink-0" aria-hidden />
          <div>
            <p className="font-semibold text-[#0B1B33]">Descargos gratuitos no habilitados</p>
            <p className="text-sm text-[#5B6980] mt-1">{elegibilidad.motivo}</p>
            <Link href="/sellos" className="mt-2 inline-block text-sm font-medium text-[#255620] underline">
              Ver el sello y el plan de mejoras
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#0B1B33]">Fiscalizaciones</h2>
          <Button size="sm" variant="outline" onClick={() => setRegistrando(true)}>
            Registrar fiscalización
          </Button>
        </div>
        {fiscalizaciones.length === 0 ? (
          <p className="mt-3 text-sm text-[#5B6980]">No hay fiscalizaciones registradas.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#F1F5F9]">
            {fiscalizaciones.map((fiscalizacion) => (
              <li key={fiscalizacion.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-[#0B1B33]">{fiscalizacion.autoridad}</p>
                  <p className="text-xs text-[#5B6980]">{formatDate(new Date(fiscalizacion.fecha))}</p>
                </div>
                <p className="text-xs font-medium text-[#5B6980]">
                  {RESULTADO_FISCALIZACION_LABEL[fiscalizacion.resultado as ResultadoFiscalizacion] ?? fiscalizacion.resultado}
                </p>
                {fiscalizacion.detalle && <p className="mt-1 text-sm text-[#334155]">{fiscalizacion.detalle}</p>}
                {fiscalizacion.acta_url && (
                  <a
                    href={hrefArchivo(fiscalizacion.acta_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#255620] underline"
                  >
                    <IconPaperclip size={14} aria-hidden /> Ver acta
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#0B1B33]">Solicitudes de descargo</h2>
        {descargos.length === 0 ? (
          <p className="mt-3 text-sm text-[#5B6980]">Aún no hay solicitudes de descargo.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#F1F5F9]">
            {descargos.map((descargo) => {
              const estado = esEstadoDescargo(descargo.estado) ? descargo.estado : "abierto";
              return (
                <li key={descargo.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[#0B1B33]">{descargo.titulo}</p>
                      <p className="text-xs text-[#5B6980]">
                        {formatDate(new Date(descargo.created_at))}
                        {descargo.solicitanteNombre ? ` · ${descargo.solicitanteNombre}` : ""}
                      </p>
                    </div>
                    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${COLOR_ESTADO[estado]}`}>
                      {ESTADO_DESCARGO_LABEL[estado]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#334155] whitespace-pre-line">{descargo.descripcion}</p>
                  {descargo.adjuntos.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-3">
                      {descargo.adjuntos.map((ruta, indice) => (
                        <li key={ruta}>
                          <a
                            href={hrefArchivo(ruta)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#255620] underline"
                          >
                            <IconPaperclip size={14} aria-hidden /> Antecedente {indice + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {descargo.respuesta && (
                    <div className="mt-3 rounded-lg bg-[#F4F6F3] px-3 py-2">
                      <p className="text-xs font-semibold text-[#5B6980]">
                        Respuesta{descargo.asesorNombre ? ` de ${descargo.asesorNombre}` : " del asesor"}
                      </p>
                      <p className="text-sm text-[#334155] whitespace-pre-line">{descargo.respuesta}</p>
                    </div>
                  )}
                  {esStaff && <DescargoGestion id={descargo.id} estado={descargo.estado} respuesta={descargo.respuesta} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <FiscalizacionDialogo abierto={registrando} puedeAdjuntar={puedeAdjuntar} onCerrar={() => setRegistrando(false)} />
      <DescargoDialogo
        abierto={solicitando}
        puedeAdjuntar={puedeAdjuntar}
        fiscalizaciones={fiscalizaciones.map((fiscalizacion) => ({
          id: fiscalizacion.id,
          fecha: new Date(fiscalizacion.fecha),
          autoridad: fiscalizacion.autoridad,
          resultado: fiscalizacion.resultado,
        }))}
        onCerrar={() => setSolicitando(false)}
      />
    </div>
  );
}
