import { ConfiguracionSellosForm } from "./ConfiguracionSellosForm";
import { InvitarNucleoButton } from "./InvitarNucleoButton";

export default async function ConfiguracionPage() {
  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Configuración</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          El sello v2 usa una fórmula fija. Los sliders de pesos ya no aplican.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      <section className="bg-white rounded-2xl border border-[#DDE3EA] p-5 space-y-3">
        <div>
          <h2 className="font-bold text-[#0B1B33]">Equipo de Núcleo</h2>
          <p className="text-sm text-[#5B6980] mt-1">
            Invita a otra persona de casa central. El registro público no puede crear este rol.
          </p>
        </div>
        <InvitarNucleoButton />
      </section>

      <ConfiguracionSellosForm />
      </div>
    </div>
  );
}
