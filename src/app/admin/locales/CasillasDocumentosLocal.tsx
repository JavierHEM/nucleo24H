"use client";

import { documentosHabilitanSello } from "@/lib/locales/documentosLocal";

export function CasillasDocumentosLocal({
  resolucionSanitaria,
  patenteComercial,
  onResolucionSanitaria,
  onPatenteComercial,
}: {
  resolucionSanitaria: boolean;
  patenteComercial: boolean;
  onResolucionSanitaria: (valor: boolean) => void;
  onPatenteComercial: (valor: boolean) => void;
}) {
  const habilitaSello = documentosHabilitanSello({
    resolucion_sanitaria_presentada: resolucionSanitaria,
    patente_comercial_al_dia: patenteComercial,
  });

  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-[#5B6980]">
        Documentos del local
      </legend>
      <p className="text-sm text-[#334155]">
        Este trámite puede tardar, pero se logra. Márcalo cuando el local ya tenga el documento. Sin ambos no puede
        obtener el sello de Núcleo.
      </p>
      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#DDE3EA] p-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-[#DDE3EA] accent-[#2F6B2A]"
          checked={resolucionSanitaria}
          onChange={(evento) => onResolucionSanitaria(evento.target.checked)}
        />
        <span>
          <span className="block text-sm font-semibold text-[#0B1B33]">Resolución sanitaria presentada</span>
          <span className="block text-xs text-[#5B6980] mt-0.5">
            El local ya presentó la resolución sanitaria ante la autoridad de salud.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#DDE3EA] p-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-[#DDE3EA] accent-[#2F6B2A]"
          checked={patenteComercial}
          onChange={(evento) => onPatenteComercial(evento.target.checked)}
        />
        <span>
          <span className="block text-sm font-semibold text-[#0B1B33]">Patente comercial al día</span>
          <span className="block text-xs text-[#5B6980] mt-0.5">
            La patente municipal del local está vigente.
          </span>
        </span>
      </label>
      <p
        className={`text-sm rounded-xl px-3 py-2 ${
          habilitaSello ? "text-[#255620] bg-[#E5F1E3]" : "text-[#16294A] bg-[#E8EEF5]"
        }`}
      >
        {habilitaSello
          ? "Con ambos documentos este local puede optar al sello de Núcleo."
          : "Sin resolución sanitaria y patente comercial al día este local no puede obtener el sello de Núcleo."}
      </p>
    </fieldset>
  );
}
