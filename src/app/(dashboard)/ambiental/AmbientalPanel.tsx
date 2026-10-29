"use client";

import { useState } from "react";
import { IconLeaf, IconTrash } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { Button } from "@/components/ui/button";
import { TIPO_AMBIENTAL_LABEL, type TipoAmbiental } from "@/lib/ambiental";
import { diasParaFecha } from "@/lib/planes";
import { formatDate } from "@/lib/utils";
import { RegistroAmbientalDialogo } from "./RegistroAmbientalDialogo";

function etiquetaTipo(tipo: string) {
  return TIPO_AMBIENTAL_LABEL[tipo as TipoAmbiental] ?? tipo;
}

export function AmbientalPanel({ puedeRegistrar }: { puedeRegistrar: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const utils = trpc.useUtils();
  const resumen = trpc.ambiental.resumen.useQuery();
  const eliminar = trpc.ambiental.eliminar.useMutation({
    onSuccess: () => utils.ambiental.resumen.invalidate(),
  });

  if (resumen.isLoading) return <p className="text-sm text-[#5B6980]">Cargando gestión ambiental…</p>;
  if (resumen.error || !resumen.data) {
    return (
      <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2">
        {resumen.error?.message ?? "No pudimos cargar la gestión ambiental."}
      </p>
    );
  }

  const { declaraciones, limiteDeclaraciones, ciclo, registros, vencimientos } = resumen.data;
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const charlasMes = registros.filter((registro) => registro.tipo === "charla" && new Date(registro.fecha) >= inicioMes).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Gestión ambiental</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Segregación de residuos, Ventanilla Única y charlas. Tu asesor registra cada gestión.
          </p>
        </div>
        {puedeRegistrar && (
          <Button onClick={() => setAbierto(true)} className="bg-[#2F6B2A] hover:bg-[#255620] text-white">
            Registrar gestión
          </Button>
        )}
      </div>

      <ScoreCards
        items={[
          {
            label: "Declaraciones VU",
            value: `${declaraciones} de ${limiteDeclaraciones}`,
            hint: `Año de contrato hasta ${formatDate(new Date(ciclo.fin))}`,
            tone: declaraciones >= limiteDeclaraciones ? "alerta" : "neutral",
          },
          { label: "Charlas del mes", value: charlasMes, hint: "Equipo del local", tone: charlasMes > 0 ? "ok" : "neutral" },
          {
            label: "Vencimientos",
            value: vencimientos.length,
            hint: "En los próximos 60 días",
            tone: vencimientos.length > 0 ? "alerta" : "ok",
          },
          { label: "Gestiones", value: registros.length, hint: "Registradas en total", tone: "neutral" },
        ]}
      />

      {vencimientos.length > 0 && (
        <section className="rounded-xl border border-[#E3B341] bg-[#FFF8E6] p-5">
          <h2 className="text-sm font-semibold text-[#5B3B00]">Vencimientos ambientales</h2>
          <ul className="mt-2 space-y-1">
            {vencimientos.map((registro) => {
              const vence = new Date(registro.vence!);
              const dias = diasParaFecha(vence);
              return (
                <li key={registro.id} className="flex justify-between gap-3 text-sm text-[#5B3B00]">
                  <span>{etiquetaTipo(registro.tipo)}</span>
                  <span className="font-medium">
                    {formatDate(vence)} · {dias < 0 ? "vencido" : `en ${dias} días`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#0B1B33]">Historial</h2>
        {registros.length === 0 ? (
          <div className="py-10 text-center">
            <IconLeaf size={32} className="mx-auto text-[#DDE3EA]" aria-hidden />
            <p className="mt-2 text-sm text-[#5B6980]">Aún no hay gestiones ambientales registradas.</p>
          </div>
        ) : (
          <ol className="mt-3 border-l border-[#DDE3EA] ml-1.5 space-y-4">
            {registros.map((registro) => (
              <li key={registro.id} className="relative pl-5">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#2F6B2A]" aria-hidden />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#0B1B33]">{etiquetaTipo(registro.tipo)}</p>
                    <p className="text-xs text-[#5B6980]">
                      {formatDate(new Date(registro.fecha))}
                      {registro.folio ? ` · Folio ${registro.folio}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-[#334155]">{registro.detalle}</p>
                  </div>
                  {puedeRegistrar && (
                    <button
                      type="button"
                      aria-label="Eliminar registro"
                      disabled={eliminar.isPending}
                      onClick={() => {
                        if (window.confirm("¿Eliminar este registro ambiental?")) {
                          eliminar.mutate({ id: registro.id });
                        }
                      }}
                      className="text-[#5B6980] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] rounded p-1"
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {eliminar.error && <p className="mt-3 text-sm text-[#B42318]">{eliminar.error.message}</p>}
      </section>

      {puedeRegistrar && <RegistroAmbientalDialogo abierto={abierto} onCerrar={() => setAbierto(false)} />}
    </div>
  );
}
