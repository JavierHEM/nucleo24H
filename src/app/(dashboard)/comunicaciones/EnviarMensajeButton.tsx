"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPencil, IconX, IconSend, IconUser } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function EnviarMensajeButton() {
  const [open, setOpen] = useState(false);
  const [paraId, setParaId] = useState<string | null>(null);
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: contactos, isLoading: cargandoContactos } =
    trpc.comunicaciones.getContactos.useQuery(undefined, { enabled: open });

  const destinatarioId = paraId ?? (contactos?.length === 1 ? contactos[0].id : null);

  const { mutateAsync, isPending } = trpc.comunicaciones.enviar.useMutation({
    onSuccess: () => {
      setOpen(false);
      setContenido("");
      setParaId(null);
      void utils.comunicaciones.list.invalidate();
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  function handleOpen() {
    setOpen(true);
    setError("");
  }

  async function handleEnviar() {
    if (!destinatarioId) {
      setError("Selecciona un destinatario.");
      return;
    }
    if (contenido.trim().length < 1) {
      setError("Escribe un mensaje antes de enviar.");
      return;
    }
    setError("");
    await mutateAsync({ para: destinatarioId, contenido });
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        className="bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
        size="sm"
      >
        <IconPencil size={16} />
        Nuevo mensaje
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3EA]">
              <p className="font-semibold text-[#0B1B33]">Nuevo mensaje</p>
              <button onClick={() => setOpen(false)} className="text-[#5B6980]">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Destinatario */}
              <div>
                <label className="text-sm font-medium text-[#0B1B33] block mb-2">
                  Para
                </label>
                {cargandoContactos ? (
                  <div className="h-10 bg-[#F4F6F3] rounded-xl animate-pulse" />
                ) : !contactos || contactos.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-[#F4F6F3] rounded-xl text-sm text-[#5B6980]">
                    <IconUser size={16} />
                    {contactos === undefined
                      ? "Cargando..."
                      : "No hay asesor asignado a este local aún."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contactos.map((c: { id: string; nombre: string; rol: string }) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setParaId(c.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                          destinatarioId === c.id
                            ? "border-[#2F6B2A] bg-[#E5F1E3]"
                            : "border-[#DDE3EA] hover:border-[#2F6B2A]/40"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#16294A] flex items-center justify-center shrink-0 text-white text-xs font-bold">
                          {c.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0B1B33]">{c.nombre}</p>
                          <p className="text-xs text-[#5B6980] capitalize">{c.rol.replace("_", " ")}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mensaje */}
              <div>
                <label className="text-sm font-medium text-[#0B1B33] block mb-2">
                  Mensaje
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escribe tu consulta o comentario..."
                  rows={4}
                  className="w-full rounded-xl border border-[#DDE3EA] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
                />
                {error && <p className="text-xs text-[#B42318] mt-1">{error}</p>}
              </div>

              <Button
                onClick={handleEnviar}
                disabled={isPending || !destinatarioId || contenido.trim().length === 0}
                className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white gap-2"
              >
                <IconSend size={16} />
                {isPending ? "Enviando..." : "Enviar mensaje"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
