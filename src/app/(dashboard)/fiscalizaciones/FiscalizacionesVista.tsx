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
    <div className="space-y-6 w-full">
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

      <section className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#DDE3EA] bg-[#F4F6F3]">
          <h2 className="text-sm font-semibold text-[#0B1B33]">Fiscalizaciones</h2>
          <Button size="sm" variant="outline" onClick={() => setRegistrando(true)}>
            Registrar fiscalización
          </Button>
        </div>
        {fiscalizaciones.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[#5B6980] text-center">No hay fiscalizaciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Autoridad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Resultado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">Detalle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Acta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3EA]">
                {fiscalizaciones.map((fiscalizacion) => (
                  <tr key={fiscalizacion.id} className="hover:bg-[#F4F6F3] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#0B1B33]">{fiscalizacion.autoridad}</td>
                    <td className="px-4 py-3 text-[#5B6980] whitespace-nowrap">
                      {formatDate(new Date(fiscalizacion.fecha))}
                    </td>
                    <td className="px-4 py-3 text-[#334155]">
                      {RESULTADO_FISCALIZACION_LABEL[fiscalizacion.resultado as ResultadoFiscalizacion] ??
                        fiscalizacion.resultado}
                    </td>
                    <td className="px-4 py-3 text-[#334155] hidden md:table-cell">
                      {fiscalizacion.detalle || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {fiscalizacion.acta_url ? (
                        <a
                          href={hrefArchivo(fiscalizacion.acta_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#255620] underline"
                        >
                          <IconPaperclip size={14} aria-hidden /> Ver acta
                        </a>
                      ) : (
                        <span className="text-[#5B6980]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DDE3EA] bg-[#F4F6F3]">
          <h2 className="text-sm font-semibold text-[#0B1B33]">Solicitudes de descargo</h2>
        </div>
        {descargos.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[#5B6980] text-center">Aún no hay solicitudes de descargo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F6F3] border-b border-[#DDE3EA]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Solicitud</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980]">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden sm:table-cell">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden lg:table-cell">
                    Antecedentes
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#5B6980] hidden md:table-cell">
                    Respuesta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3EA]">
                {descargos.map((descargo) => {
                  const estado = esEstadoDescargo(descargo.estado) ? descargo.estado : "abierto";
                  return (
                    <tr key={descargo.id} className="hover:bg-[#F4F6F3] transition-colors align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0B1B33]">{descargo.titulo}</p>
                        <p className="text-sm text-[#334155] mt-1 whitespace-pre-line">{descargo.descripcion}</p>
                        {esStaff && (
                          <DescargoGestion id={descargo.id} estado={descargo.estado} respuesta={descargo.respuesta} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${COLOR_ESTADO[estado]}`}
                        >
                          {ESTADO_DESCARGO_LABEL[estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5B6980] hidden sm:table-cell whitespace-nowrap">
                        {formatDate(new Date(descargo.created_at))}
                        {descargo.solicitanteNombre ? ` · ${descargo.solicitanteNombre}` : ""}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {descargo.adjuntos.length > 0 ? (
                          <ul className="flex flex-col gap-1">
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
                        ) : (
                          <span className="text-[#5B6980]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[#334155] whitespace-pre-line">
                        {descargo.respuesta ? (
                          <>
                            {descargo.asesorNombre ? (
                              <p className="text-xs font-semibold text-[#5B6980] mb-1">{descargo.asesorNombre}</p>
                            ) : null}
                            {descargo.respuesta}
                          </>
                        ) : (
                          <span className="text-[#5B6980]">Sin respuesta</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
