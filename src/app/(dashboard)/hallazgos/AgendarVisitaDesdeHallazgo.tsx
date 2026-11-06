"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgendarVisitaDialogo } from "../calendario/AgendarVisitaDialogo";

export function AgendarVisitaDesdeHallazgo({
  tenantId,
  hallazgoId,
  descripcion,
}: {
  tenantId: string;
  hallazgoId: string;
  descripcion: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="min-h-12 px-4 rounded-lg bg-[#16294A] text-white text-sm font-medium"
      >
        Agendar visita de verificación
      </button>
      <AgendarVisitaDialogo
        abierto={abierto}
        tenantId={tenantId}
        onCerrar={() => {
          setAbierto(false);
          router.refresh();
        }}
        hallazgoInicial={{ id: hallazgoId, descripcion }}
      />
    </>
  );
}
