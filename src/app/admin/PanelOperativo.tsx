import { AVISO_RENOVACION_DIAS, PLAN_IDS, PLANES, diasParaFecha } from "@/lib/planes";
import { formatCLP, formatDate } from "@/lib/utils";
import { VerLocalButton } from "./locales/VerLocalButton";
import type { cargarPanelOperativo } from "@/server/admin/panelOperativo";

type Panel = Awaited<ReturnType<typeof cargarPanelOperativo>>;

const MAX_FILAS = 5;

function Tarjeta({
  titulo,
  total,
  alerta,
  children,
  vacio,
}: {
  titulo: string;
  total: number;
  alerta: boolean;
  children: React.ReactNode;
  vacio: string;
}) {
  return (
    <section className="rounded-xl border border-[#DDE3EA] bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#0B1B33]">{titulo}</h2>
        <p className={`font-mono text-2xl font-semibold ${alerta && total > 0 ? "text-[#8A5A00]" : "text-[#0B1B33]"}`}>{total}</p>
      </div>
      {total === 0 ? <p className="mt-2 text-xs text-[#5B6980]">{vacio}</p> : <ul className="mt-2 divide-y divide-[#F1F5F9]">{children}</ul>}
      {total > MAX_FILAS && <p className="mt-2 text-xs text-[#5B6980]">y {total - MAX_FILAS} más</p>}
    </section>
  );
}

function Fila({ nombre, detalle, tenantId, destino, etiqueta }: { nombre: string; detalle?: string; tenantId: string; destino: string; etiqueta: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-[#334155]">{nombre}</p>
        {detalle && <p className="truncate text-xs text-[#5B6980]">{detalle}</p>}
      </div>
      <VerLocalButton tenantId={tenantId} destino={destino} etiqueta={etiqueta} />
    </li>
  );
}

export function PanelOperativo({ panel }: { panel: Panel }) {
  const ahora = new Date();
  return (
    <div className="space-y-4">
      <h2 className="font-mono text-xs uppercase tracking-wide text-[#5B6980]">Operación</h2>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLAN_IDS.map((id) => (
          <div key={id} className="rounded-xl border border-[#DDE3EA] bg-white p-5">
            <p className="text-sm font-semibold text-[#0B1B33]">{PLANES[id].nombre}</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-[#0B1B33]">{panel.porPlan[id].locales}</p>
            <p className="text-xs text-[#5B6980]">
              locales · {formatCLP(panel.porPlan[id].ingresoMensual)} al mes
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tarjeta
          titulo={`Contratos por vencer (${AVISO_RENOVACION_DIAS} días)`}
          total={panel.contratosPorVencer.length}
          alerta
          vacio="Ningún contrato vence pronto."
        >
          {panel.contratosPorVencer.slice(0, MAX_FILAS).map((contrato) => {
            const dias = diasParaFecha(contrato.hasta, ahora);
            return (
              <Fila
                key={contrato.tenantId}
                nombre={contrato.nombre}
                detalle={`${formatDate(contrato.hasta)} · ${dias < 0 ? "vencido" : `en ${dias} días`}`}
                tenantId={contrato.tenantId}
                destino="/suscripcion"
                etiqueta="Renovar"
              />
            );
          })}
        </Tarjeta>

        <Tarjeta titulo="Descargos abiertos" total={panel.descargosAbiertos.length} alerta vacio="No hay descargos abiertos.">
          {panel.descargosAbiertos.slice(0, MAX_FILAS).map((descargo) => (
            <Fila
              key={descargo.id}
              nombre={descargo.nombre}
              detalle={descargo.titulo}
              tenantId={descargo.tenantId}
              destino="/fiscalizaciones"
              etiqueta="Abrir"
            />
          ))}
        </Tarjeta>

        <Tarjeta titulo="Locales sin visita este mes" total={panel.sinVisitaEsteMes.length} alerta vacio="Todos los locales tienen visita este mes.">
          {panel.sinVisitaEsteMes.slice(0, MAX_FILAS).map((local) => (
            <Fila key={local.id} nombre={local.nombre} tenantId={local.id} destino="/calendario" etiqueta="Agendar" />
          ))}
        </Tarjeta>

        <Tarjeta titulo="Locales sin asesor" total={panel.sinAsesor.length} alerta vacio="Todos los locales tienen asesor.">
          {panel.sinAsesor.slice(0, MAX_FILAS).map((local) => (
            <Fila key={local.id} nombre={local.nombre} tenantId={local.id} destino="/admin/locales" etiqueta="Asignar" />
          ))}
        </Tarjeta>
      </div>
    </div>
  );
}
