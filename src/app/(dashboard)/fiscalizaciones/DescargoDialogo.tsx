"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArchivosAdjuntos, type ArchivoSubido } from "@/components/ui/ArchivosAdjuntos";
import { MAX_ADJUNTOS_DESCARGO, RESULTADO_FISCALIZACION_LABEL, type ResultadoFiscalizacion } from "@/lib/descargos";
import { formatDate } from "@/lib/utils";

const formSchema = z.object({
  titulo: z.string().trim().min(3, "Escribe un título breve.").max(140),
  descripcion: z.string().trim().min(10, "Cuéntanos qué ocurrió para poder ayudarte.").max(4000),
  fiscalizacion_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export type FiscalizacionOpcion = { id: string; fecha: Date; autoridad: string; resultado: string };

export function DescargoDialogo({
  abierto,
  puedeAdjuntar,
  fiscalizaciones,
  onCerrar,
}: {
  abierto: boolean;
  puedeAdjuntar: boolean;
  fiscalizaciones: FiscalizacionOpcion[];
  onCerrar: () => void;
}) {
  const [adjuntos, setAdjuntos] = useState<ArchivoSubido[]>([]);
  const utils = trpc.useUtils();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const solicitar = trpc.fiscalizaciones.solicitarDescargo.useMutation({
    onSuccess: async () => {
      await utils.fiscalizaciones.resumen.invalidate();
      reset();
      setAdjuntos([]);
      onCerrar();
    },
  });

  return (
    <Dialogo abierto={abierto} titulo="Solicitar descargo" onCerrar={onCerrar}>
      <form
        onSubmit={handleSubmit((datos) =>
          solicitar.mutate({
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            fiscalizacion_id: datos.fiscalizacion_id || undefined,
            adjuntos: adjuntos.map((adjunto) => adjunto.ruta),
          })
        )}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="desc-titulo">Título</Label>
          <Input id="desc-titulo" className="mt-1 min-h-12" {...register("titulo")} />
          {errors.titulo && <p className="text-xs text-[#B42318] mt-1">{errors.titulo.message}</p>}
        </div>
        <div>
          <Label htmlFor="desc-descripcion">Qué ocurrió</Label>
          <textarea
            id="desc-descripcion"
            rows={5}
            {...register("descripcion")}
            className="mt-1 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
          />
          {errors.descripcion && <p className="text-xs text-[#B42318] mt-1">{errors.descripcion.message}</p>}
        </div>
        {fiscalizaciones.length > 0 && (
          <div>
            <Label htmlFor="desc-fiscalizacion">Fiscalización relacionada (opcional)</Label>
            <select
              id="desc-fiscalizacion"
              {...register("fiscalizacion_id")}
              className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
            >
              <option value="">Ninguna</option>
              {fiscalizaciones.map((fiscalizacion) => (
                <option key={fiscalizacion.id} value={fiscalizacion.id}>
                  {formatDate(fiscalizacion.fecha)} · {fiscalizacion.autoridad} ·{" "}
                  {RESULTADO_FISCALIZACION_LABEL[fiscalizacion.resultado as ResultadoFiscalizacion] ?? fiscalizacion.resultado}
                </option>
              ))}
            </select>
          </div>
        )}
        {puedeAdjuntar && (
          <div>
            <Label>Antecedentes (hasta {MAX_ADJUNTOS_DESCARGO} archivos)</Label>
            <div className="mt-1">
              <ArchivosAdjuntos bucket="documentos" valor={adjuntos} onCambio={setAdjuntos} maximo={MAX_ADJUNTOS_DESCARGO} />
            </div>
          </div>
        )}

        {solicitar.error && (
          <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">{solicitar.error.message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={solicitar.isPending} className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white">
            {solicitar.isPending ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
