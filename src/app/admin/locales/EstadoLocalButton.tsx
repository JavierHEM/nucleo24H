"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2, IconPlayerPause, IconPlayerPlay, IconTrash } from "@tabler/icons-react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { NOTA_LEY_21719_LOCAL } from "@/lib/locales/estado";

type Accion = "suspendido" | "activo" | "baja";

const COPY: Record<Accion, { titulo: string; boton: string; detalle: string; destructivo: boolean }> = {
  suspendido: {
    titulo: "Suspender local",
    boton: "Suspender",
    detalle:
      "El equipo deja de ver este local en el selector y no puede cargar registros ni visitas. Los datos se conservan y puedes reactivarlo después.",
    destructivo: false,
  },
  activo: {
    titulo: "Reactivar local",
    boton: "Reactivar",
    detalle: "Vuelve a aparecer en el selector y el equipo puede operar de nuevo.",
    destructivo: false,
  },
  baja: {
    titulo: "Dar de baja el local",
    boton: "Dar de baja",
    detalle:
      "Termina el servicio de este local. No borramos datos personales de oficio: el titular los pide en Mi cuenta (ARSOPB). Conservamos los registros sanitarios que exige la normativa.",
    destructivo: true,
  },
};

export function EstadoLocalButton({
  tenantId,
  nombre,
  estado,
}: {
  tenantId: string;
  nombre: string;
  estado: string;
}) {
  const router = useRouter();
  const [accion, setAccion] = useState<Accion | null>(null);
  const actualizar = trpc.locales.actualizar.useMutation({
    onSuccess: () => {
      setAccion(null);
      router.refresh();
    },
  });

  function pedir(siguiente: Accion) {
    setAccion(siguiente);
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        {estado === "activo" && (
          <button
            type="button"
            onClick={() => pedir("suspendido")}
            className="inline-flex items-center gap-1 min-h-11 px-3 rounded-lg text-xs font-medium text-[#7A5000] border border-[#F8E8C4] hover:bg-[#FCF0D0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
          >
            <IconPlayerPause size={13} />
            Suspender
          </button>
        )}
        {estado !== "activo" && estado !== "pendiente" && (
          <button
            type="button"
            onClick={() => pedir("activo")}
            className="inline-flex items-center gap-1 min-h-11 px-3 rounded-lg text-xs font-medium text-[#255620] border border-[#BBF7D0] hover:bg-[#E5F1E3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
          >
            <IconPlayerPlay size={13} />
            Reactivar
          </button>
        )}
        {estado !== "baja" && (
          <button
            type="button"
            onClick={() => pedir("baja")}
            className="inline-flex items-center gap-1 min-h-11 px-3 rounded-lg text-xs font-medium text-[#9A1C12] border border-[#FECACA] hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
          >
            <IconTrash size={13} />
            Dar de baja
          </button>
        )}
      </div>

      {accion && (
        <Dialogo abierto titulo={COPY[accion].titulo} onCerrar={() => setAccion(null)}>
          <div className="space-y-4">
            <p className="text-sm text-[#0B1B33]">
              {COPY[accion].detalle} Esto aplica a <strong>{nombre}</strong>.
            </p>
            <p className="text-xs text-[#5B6980] leading-relaxed rounded-xl bg-[#F4F6F3] px-3 py-2">
              {NOTA_LEY_21719_LOCAL}
            </p>
            {actualizar.error && (
              <p className="text-sm text-[#B42318]" role="alert">
                {actualizar.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAccion(null)} disabled={actualizar.isPending}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={actualizar.isPending}
                onClick={() => actualizar.mutate({ id: tenantId, estado: accion })}
                className={
                  COPY[accion].destructivo
                    ? "bg-[#B42318] hover:bg-[#9A1C12] text-white"
                    : "bg-[#2F6B2A] hover:bg-[#255620] text-white"
                }
              >
                {actualizar.isPending && <IconLoader2 size={16} className="animate-spin" />}
                {COPY[accion].boton}
              </Button>
            </div>
          </div>
        </Dialogo>
      )}
    </>
  );
}
