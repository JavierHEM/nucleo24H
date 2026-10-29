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
import { RESULTADOS_FISCALIZACION, RESULTADO_FISCALIZACION_LABEL } from "@/lib/descargos";

const formSchema = z.object({
  fecha: z.string().min(1, "Indica la fecha."),
  autoridad: z.string().trim().min(2, "Indica la autoridad que fiscalizó.").max(120),
  resultado: z.enum(RESULTADOS_FISCALIZACION),
  detalle: z.string().trim().max(2000).optional(),
});

type FormData = z.infer<typeof formSchema>;

const hoy = () => new Date().toISOString().slice(0, 10);

export function FiscalizacionDialogo({
  abierto,
  puedeAdjuntar,
  onCerrar,
}: {
  abierto: boolean;
  puedeAdjuntar: boolean;
  onCerrar: () => void;
}) {
  const [acta, setActa] = useState<ArchivoSubido[]>([]);
  const utils = trpc.useUtils();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fecha: hoy(), resultado: "con_observaciones" },
  });

  const registrar = trpc.fiscalizaciones.registrarFiscalizacion.useMutation({
    onSuccess: async () => {
      await utils.fiscalizaciones.resumen.invalidate();
      reset({ fecha: hoy(), resultado: "con_observaciones" });
      setActa([]);
      onCerrar();
    },
  });

  return (
    <Dialogo abierto={abierto} titulo="Registrar fiscalización" onCerrar={onCerrar}>
      <form
        onSubmit={handleSubmit((datos) =>
          registrar.mutate({
            fecha: new Date(`${datos.fecha}T12:00:00`).toISOString(),
            autoridad: datos.autoridad,
            resultado: datos.resultado,
            detalle: datos.detalle || undefined,
            acta_url: acta[0]?.ruta,
          })
        )}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="fis-fecha">Fecha</Label>
          <Input id="fis-fecha" type="date" className="mt-1 min-h-12" {...register("fecha")} />
          {errors.fecha && <p className="text-xs text-[#B42318] mt-1">{errors.fecha.message}</p>}
        </div>
        <div>
          <Label htmlFor="fis-autoridad">Autoridad</Label>
          <Input id="fis-autoridad" className="mt-1 min-h-12" {...register("autoridad")} />
          {errors.autoridad && <p className="text-xs text-[#B42318] mt-1">{errors.autoridad.message}</p>}
        </div>
        <div>
          <Label htmlFor="fis-resultado">Resultado</Label>
          <select
            id="fis-resultado"
            {...register("resultado")}
            className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
          >
            {RESULTADOS_FISCALIZACION.map((valor) => (
              <option key={valor} value={valor}>
                {RESULTADO_FISCALIZACION_LABEL[valor]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="fis-detalle">Detalle (opcional)</Label>
          <textarea
            id="fis-detalle"
            rows={3}
            {...register("detalle")}
            className="mt-1 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
          />
        </div>
        {puedeAdjuntar && (
          <div>
            <Label>Acta de la fiscalización (opcional)</Label>
            <div className="mt-1">
              <ArchivosAdjuntos bucket="documentos" valor={acta} onCambio={setActa} maximo={1} etiqueta="Adjuntar acta" />
            </div>
          </div>
        )}

        {registrar.error && (
          <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">{registrar.error.message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={registrar.isPending} className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white">
            {registrar.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
