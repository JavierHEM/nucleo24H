import { prisma } from "@/server/db/prisma";
import { ConfiguracionSellosForm } from "./ConfiguracionSellosForm";
import { InvitarNucleoButton } from "./InvitarNucleoButton";

export default async function ConfiguracionPage() {
  const config = await prisma.configuracionSellos.findFirst({
    orderBy: { updated_at: "desc" },
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Configuración del Sello</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Ajusta los pesos y umbrales que determinan el nivel del sello mensual.
        </p>
      </div>

      {/* Info */}
      <div className="bg-[#E5F1E3] rounded-xl p-4 text-sm text-[#255620]">
        <p className="font-medium mb-1">Fórmula del sello</p>
        <code className="text-xs bg-white/60 rounded px-2 py-0.5">
          Score = (Documentación × P1) + (Condiciones × P2) + (Capacitaciones × P3) + (Tareas × P4)
        </code>
        <p className="text-xs mt-2 text-[#3D7A27]">
          La suma de todos los pesos debe ser igual a 1.00
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-[#DDE3EA] p-5 space-y-3">
        <div>
          <h2 className="font-bold text-[#0B1B33]">Equipo de Núcleo</h2>
          <p className="text-sm text-[#5B6980] mt-1">
            Invita a otra persona de casa central. El registro público no puede crear este rol.
          </p>
        </div>
        <InvitarNucleoButton />
      </section>

      <ConfiguracionSellosForm
        configActual={
          config
            ? {
                id: config.id,
                peso_documentacion: config.peso_documentacion,
                peso_condiciones: config.peso_condiciones,
                peso_capacitaciones: config.peso_capacitaciones,
                peso_tareas: config.peso_tareas,
                umbral_intermedio: config.umbral_intermedio,
                umbral_avanzado: config.umbral_avanzado,
                umbral_premium: config.umbral_premium,
              }
            : undefined
        }
      />
    </div>
  );
}
