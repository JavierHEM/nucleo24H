import { IconChevronDown, IconDownload } from "@tabler/icons-react";
import { GRUPOS_PROTOCOLO, PROTOCOLOS, protocolosDe, urlOficial, type ArchivoOficial, type ProtocoloOficial } from "@/lib/bpm/biblioteca";
import { ScoreCards, type ScoreItem } from "@/components/dashboard/ScoreCards";

function Enlace({ archivo, etiqueta }: { archivo: ArchivoOficial; etiqueta: string }) {
  return (
    <a
      href={urlOficial(archivo.path)}
      className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg border border-[#DDE3EA] text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
    >
      <IconDownload size={15} />
      {etiqueta}
    </a>
  );
}

function TarjetaProtocolo({ protocolo }: { protocolo: ProtocoloOficial }) {
  const plantillas = protocolo.plantillas.length;
  const resumen =
    plantillas === 0
      ? "Las planillas vienen en el protocolo"
      : `${plantillas} plantilla${plantillas === 1 ? "" : "s"}`;

  return (
    <details className="group h-full bg-white rounded-xl border border-[#DDE3EA] open:border-[#16294A]">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-start justify-between gap-3 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] rounded-xl">
        <span className="min-w-0">
          <span className="block font-mono text-[11px] text-[#5B6980]">{protocolo.codigo}</span>
          <span className="block font-semibold text-sm text-[#0B1B33] mt-0.5">{protocolo.nombre}</span>
          <span className="block text-xs text-[#5B6980] mt-1">{resumen}</span>
        </span>
        <IconChevronDown
          size={16}
          className="mt-1 shrink-0 text-[#5B6980] motion-safe:transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-4 pb-4 space-y-3 border-t border-[#F1F5F9]">
        <div className="flex items-center justify-between gap-3 pt-3">
          <p className="text-sm text-[#334155]">Procedimiento</p>
          <Enlace archivo={protocolo.procedimiento} etiqueta="Protocolo" />
        </div>
        {plantillas > 0 ? (
          <ul className="space-y-2">
            {protocolo.plantillas.map((plantilla) => (
              <li key={plantilla.path} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {plantilla.codigo && (
                    <p className="font-mono text-[11px] text-[#5B6980]">{plantilla.codigo}</p>
                  )}
                  <p className="text-sm text-[#334155]">{plantilla.nombre}</p>
                </div>
                <Enlace archivo={plantilla} etiqueta="Plantilla" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#5B6980]">Las planillas de este protocolo vienen dentro del mismo archivo.</p>
        )}
      </div>
    </details>
  );
}

export function BibliotecaProtocolos() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#0B1B33]">Protocolos y plantillas</h2>
        <p className="text-sm text-[#5B6980] mt-1">
          Abre un protocolo para descargarlo. Úsalo en papel si no registras en el sistema.
        </p>
      </div>

      <ScoreCards
        items={[
          ...GRUPOS_PROTOCOLO.map(
            (grupo): ScoreItem => ({
              label: grupo.titulo,
              value: protocolosDe(grupo.id).length,
              hint: "Protocolos",
              tone: "neutral",
            })
          ),
          {
            label: "Plantillas",
            value: PROTOCOLOS.reduce((suma, protocolo) => suma + protocolo.plantillas.length, 0),
            hint: "Para imprimir",
            tone: "neutral",
          },
        ]}
      />

      {GRUPOS_PROTOCOLO.map((grupo) => {
        const protocolos = protocolosDe(grupo.id);
        return (
          <div key={grupo.id} className="space-y-3">
            <div>
              <h3 className="font-mono text-sm font-semibold text-[#0B1B33]">{grupo.titulo}</h3>
              <p className="text-sm text-[#5B6980]">{grupo.bajada}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {protocolos.map((protocolo) => (
                <TarjetaProtocolo key={protocolo.codigo} protocolo={protocolo} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
