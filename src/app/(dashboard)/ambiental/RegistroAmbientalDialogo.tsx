"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TIPOS_AMBIENTAL, TIPO_AMBIENTAL_LABEL } from "@/lib/ambiental";

const formSchema = z.object({
  tipo: z.enum(TIPOS_AMBIENTAL),
  fecha: z.string().min(1, "Indica la fecha."),
  detalle: z.string().trim().min(3, "Describe brevemente lo realizado.").max(1000),
  folio: z.string().trim().max(60).optional(),
  vence: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const alMediodia = (fecha: string) => new Date(`${fecha}T12:00:00`).toISOString();
const hoy = () => new Date().toISOString().slice(0, 10);

export function RegistroAmbientalDialogo({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const utils = trpc.useUtils();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { tipo: "ventanilla_unica", fecha: hoy() },
  });

  const registrar = trpc.ambiental.registrar.useMutation({
    onSuccess: async () => {
      await utils.ambiental.resumen.invalidate();
      await utils.plan.resumen.invalidate();
      reset({ tipo: "ventanilla_unica", fecha: hoy() });
      onCerrar();
    },
  });

  const tipo = watch("tipo");

  return (
    <Dialogo abierto={abierto} titulo="Registrar gestión ambiental" onCerrar={onCerrar}>
      <form
        onSubmit={handleSubmit((datos) =>
          registrar.mutate({
            tipo: datos.tipo,
            fecha: alMediodia(datos.fecha),
            detalle: datos.detalle,
            folio: datos.folio || undefined,
            vence: datos.vence ? alMediodia(datos.vence) : undefined,
          })
        )}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="amb-tipo">Tipo</Label>
          <select
            id="amb-tipo"
            {...register("tipo")}
            className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
          >
            {TIPOS_AMBIENTAL.map((valor) => (
              <option key={valor} value={valor}>
                {TIPO_AMBIENTAL_LABEL[valor]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="amb-fecha">Fecha</Label>
          <Input id="amb-fecha" type="date" className="mt-1 min-h-12" {...register("fecha")} />
          {errors.fecha && <p className="text-xs text-[#B42318] mt-1">{errors.fecha.message}</p>}
        </div>

        <div>
          <Label htmlFor="amb-detalle">Detalle</Label>
          <textarea
            id="amb-detalle"
            rows={3}
            {...register("detalle")}
            className="mt-1 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
          />
          {errors.detalle && <p className="text-xs text-[#B42318] mt-1">{errors.detalle.message}</p>}
        </div>

        {tipo === "ventanilla_unica" && (
          <div>
            <Label htmlFor="amb-folio">Folio de la declaración</Label>
            <Input id="amb-folio" className="mt-1 min-h-12" {...register("folio")} />
          </div>
        )}

        <div>
          <Label htmlFor="amb-vence">Vencimiento o próximo plazo (opcional)</Label>
          <Input id="amb-vence" type="date" className="mt-1 min-h-12" {...register("vence")} />
        </div>

        {registrar.error && (
          <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">{registrar.error.message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={registrar.isPending}
            className="flex-1 bg-[#2F6B2A] hover:bg-[#255620] text-white"
          >
            {registrar.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
