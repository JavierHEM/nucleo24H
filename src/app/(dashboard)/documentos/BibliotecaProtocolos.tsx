import { IconDownload } from "@tabler/icons-react";
import { GRUPOS_PROTOCOLO, protocolosDe, urlOficial, type ArchivoOficial } from "@/lib/bpm/biblioteca";

function Enlace({ archivo, etiqueta }: { archivo: ArchivoOficial; etiqueta: string }) {
  return (
    <a
      href={urlOficial(archivo.path)}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#143556] shrink-0"
    >
      <IconDownload size={15} />
      {etiqueta}
    </a>
  );
}

export function BibliotecaProtocolos() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#0B2545]">Protocolos y plantillas</h2>
        <p className="text-sm text-[#64748B] mt-1">
          Descárgalos para completarlos en papel si no usas los registros del sistema.
        </p>
      </div>

      {GRUPOS_PROTOCOLO.map((grupo) => {
        const protocolos = protocolosDe(grupo.id);
        return (
          <div key={grupo.id} className="space-y-3">
            <div>
              <h3 className="font-mono text-sm font-semibold text-[#0B2545]">{grupo.titulo}</h3>
              <p className="text-sm text-[#64748B]">{grupo.bajada}</p>
            </div>
            <div className="space-y-3">
              {protocolos.map((protocolo) => (
                <article key={protocolo.codigo} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-[#64748B]">{protocolo.codigo}</p>
                      <p className="font-semibold text-sm text-[#0B2545] mt-0.5">{protocolo.nombre}</p>
                    </div>
                    <Enlace archivo={protocolo.procedimiento} etiqueta="Protocolo" />
                  </div>

                  {protocolo.plantillas.length > 0 ? (
                    <ul className="mt-3 border-t border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                      {protocolo.plantillas.map((plantilla) => (
                        <li key={plantilla.path} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            {plantilla.codigo && (
                              <p className="font-mono text-[11px] text-[#64748B]">{plantilla.codigo}</p>
                            )}
                            <p className="text-sm text-[#334155]">{plantilla.nombre}</p>
                          </div>
                          <Enlace archivo={plantilla} etiqueta="Plantilla" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#64748B] mt-3">
                      Las planillas de este protocolo vienen dentro del mismo archivo.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
