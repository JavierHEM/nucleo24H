"use client";

import { COMPONENTES_SEGUIMIENTO, COMPONENTES_VISITA, UMBRALES_V2 } from "@/lib/sellos/v2";

export function ConfiguracionSellosForm() {
  return (
    <div className="bg-white rounded-xl border border-[#DDE3EA] p-5 space-y-4 text-sm text-[#334155]">
      <p className="font-semibold text-[#0B1B33]">Fórmula vigente (código, no editable)</p>
      <p>Seguimiento 60 pts + visita 40 pts. Los controles no aplicables se excluyen y sus puntos se redistribuyen en el mismo componente.</p>
      <ul className="list-disc pl-5 space-y-1">
        {COMPONENTES_SEGUIMIENTO.map((c) => (
          <li key={c.id}>
            {c.etiqueta}: {c.puntos} pts
          </li>
        ))}
        {COMPONENTES_VISITA.map((c) => (
          <li key={c.id}>
            {c.etiqueta}: {c.puntos} pts
          </li>
        ))}
      </ul>
      <p>
        Umbrales: sin sello bajo {UMBRALES_V2.bronce}; Bronce {UMBRALES_V2.bronce}–{UMBRALES_V2.plata - 1}; Plata{" "}
        {UMBRALES_V2.plata}–{UMBRALES_V2.oro - 1}; Oro {UMBRALES_V2.oro}–100. Un hallazgo crítico abierto bloquea el sello.
      </p>
    </div>
  );
}
