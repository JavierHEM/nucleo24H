import { IconMail } from "@tabler/icons-react";
import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import { ScoreCards } from "@/components/dashboard/ScoreCards";
import { MarcarLeadButton } from "./MarcarLeadButton";

export default async function AdminLeadsPage() {
  const caller = await getCaller();
  const data = await caller.leads.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
          <IconMail size={26} className="text-[#2F6B2A]" />
          Solicitudes de diagnóstico
        </h1>
        <p className="text-sm text-[#5B6980] mt-1">Contactos enviados desde la landing pública.</p>
      </div>

      <ScoreCards
        items={[
          { label: "Pendientes", value: data.totalPendientes, hint: "Por contactar", tone: data.totalPendientes > 0 ? "alerta" : "ok" },
          { label: "Atendidas", value: data.atendidos.length, hint: "En esta lista", tone: "neutral" },
        ]}
      />

      <Lista titulo="Pendientes" vacio="No hay solicitudes por atender." leads={data.pendientes} />
      <Lista titulo="Atendidas" vacio="Aún no marcas ninguna como atendida." leads={data.atendidos} />
    </div>
  );
}

type LeadFila = {
  id: string;
  nombre: string;
  local: string;
  telefono: string;
  tipo_local: string;
  mensaje: string | null;
  atendido: boolean;
  created_at: Date;
};

function Lista({ titulo, vacio, leads }: { titulo: string; vacio: string; leads: LeadFila[] }) {
  return (
    <section className="bg-white rounded-xl border border-[#DDE3EA] shadow-sm overflow-hidden">
      <h2 className="px-5 py-3 text-sm font-semibold text-[#0B1B33] border-b border-[#DDE3EA]">{titulo}</h2>
      {leads.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[#5B6980] text-center">{vacio}</p>
      ) : (
        <ul className="divide-y divide-[#F1F5F9]">
          {leads.map((lead) => (
            <li key={lead.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#0B1B33]">
                  {lead.nombre} · {lead.local}
                </p>
                <p className="text-sm text-[#5B6980] mt-0.5">
                  {lead.tipo_local} · {lead.telefono} · {formatDate(lead.created_at)}
                </p>
                {lead.mensaje && <p className="text-sm text-[#334155] mt-2 max-w-xl">{lead.mensaje}</p>}
              </div>
              <MarcarLeadButton id={lead.id} atendido={lead.atendido} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
