"use client";

import { useState } from "react";
import Link from "next/link";
import { IconPlayerPlay, IconPlus, IconPencil, IconTrash, IconVideo } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { TutorialFormulario } from "./TutorialFormulario";

type TutorialEditar = {
  id: string;
  titulo: string;
  descripcion: string;
  ruta_video: string;
  activo: boolean;
  roles: string[];
};

export function TutorialesAdmin() {
  const listado = trpc.tutoriales.list.useQuery();
  const utils = trpc.useUtils();
  const eliminar = trpc.tutoriales.eliminar.useMutation();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<TutorialEditar | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  async function abrirEdicion(id: string) {
    const data = await utils.tutoriales.get.fetch({ id });
    setEditando({
      id: data.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      ruta_video: data.ruta_video,
      activo: data.activo,
      roles: data.roles,
    });
    setAbierto(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33]">Tutoriales</h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Videos de cómo usar el sistema. Tú los subes y eliges qué roles pueden verlos.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            setAbierto(true);
          }}
        >
          <IconPlus size={16} />
          Nuevo video
        </Button>
      </div>

      {listado.data?.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[#DDE3EA] bg-white p-12 text-center">
          <IconVideo size={28} className="mx-auto text-[#2F6B2A]" />
          <p className="font-semibold text-[#0B1B33] mt-3">Aún no hay tutoriales</p>
          <p className="text-sm text-[#5B6980] mt-1">Sube el primer video para el equipo.</p>
        </div>
      )}

      {listado.data && listado.data.length > 0 && (
        <ul className="bg-white rounded-xl border border-[#DDE3EA] divide-y divide-[#DDE3EA]">
          {listado.data.map((tutorial) => (
            <li key={tutorial.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#0B1B33]">{tutorial.titulo}</p>
                <p className="text-sm text-[#5B6980] mt-0.5">
                  {tutorial.activo ? "Visible" : "Oculto"} · {tutorial.rolesLabel} · {formatDate(tutorial.created_at)}
                </p>
                {tutorial.descripcion && (
                  <p className="text-sm text-[#334155] mt-2 max-w-2xl">{tutorial.descripcion}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/tutoriales/${tutorial.id}`}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-sm font-medium border border-[#DDE3EA] hover:bg-[#F4F6F3]"
                >
                  <IconPlayerPlay size={14} />
                  Ver
                </Link>
                <Button type="button" variant="outline" size="sm" onClick={() => void abrirEdicion(tutorial.id)}>
                  <IconPencil size={14} />
                  Editar
                </Button>
                {confirmar === tutorial.id ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await eliminar.mutateAsync({ id: tutorial.id });
                      await listado.refetch();
                      setConfirmar(null);
                    }}
                  >
                    Confirmar
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmar(tutorial.id)}>
                    <IconTrash size={14} />
                    Eliminar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {abierto && (
        <TutorialFormulario
          abierto={abierto}
          tutorial={editando}
          onCerrar={() => {
            setAbierto(false);
            setEditando(null);
            void listado.refetch();
          }}
        />
      )}
    </div>
  );
}
