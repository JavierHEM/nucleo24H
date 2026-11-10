"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { IconLoader2, IconPencil } from "@tabler/icons-react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { localOperativoSchema, type LocalOperativoInput } from "@/lib/locales/ficha";
import { TIPOS_LOCAL, TIPO_LOCAL_LABEL, normalizarTipoLocal } from "@/lib/planes";
import { CasillasDocumentosLocal } from "./CasillasDocumentosLocal";

const CAMPO =
  "mt-1 w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]";

export function EditarLocalButton({
  tenantId,
  nombre,
  direccion,
  ciudad,
  telefono,
  tipoLocal,
  encargadoNombre,
  encargadoTelefono,
  resolucionSanitaria,
  patenteComercial,
}: {
  tenantId: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  tipoLocal: string;
  encargadoNombre: string | null;
  encargadoTelefono: string | null;
  resolucionSanitaria: boolean;
  patenteComercial: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();
  const actualizar = trpc.locales.actualizar.useMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LocalOperativoInput>({
    resolver: zodResolver(localOperativoSchema),
    values: {
      nombre,
      direccion,
      ciudad,
      telefono,
      tipo_local: normalizarTipoLocal(tipoLocal),
      encargado_nombre: encargadoNombre ?? "",
      encargado_telefono: encargadoTelefono ?? "",
      resolucion_sanitaria_presentada: resolucionSanitaria,
      patente_comercial_al_dia: patenteComercial,
    },
  });

  function cerrar() {
    reset();
    setAbierto(false);
  }

  async function onSubmit(data: LocalOperativoInput) {
    await actualizar.mutateAsync({
      id: tenantId,
      nombre: data.nombre,
      direccion: data.direccion,
      ciudad: data.ciudad,
      telefono: data.telefono,
      tipo_local: data.tipo_local,
      encargado_nombre: data.encargado_nombre ?? null,
      encargado_telefono: data.encargado_telefono ?? null,
      resolucion_sanitaria_presentada: data.resolucion_sanitaria_presentada,
      patente_comercial_al_dia: data.patente_comercial_al_dia,
    });
    void utils.locales.list.invalidate();
    void utils.locales.porRut.invalidate();
    void utils.empresas.porRut.invalidate();
    cerrar();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 min-h-11 px-3 rounded-lg text-xs font-medium text-[#16294A] border border-[#DDE3EA] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        <IconPencil size={13} />
        Editar
      </button>

      <Dialogo
        abierto={abierto}
        titulo="Editar local"
        onCerrar={cerrar}
        ancho="lg"
        pie={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={cerrar} disabled={actualizar.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={`editar-local-${tenantId}`}
              disabled={actualizar.isPending}
              className="min-h-12 rounded-xl bg-[#2F6B2A] hover:bg-[#255620] text-white"
            >
              {actualizar.isPending && <IconLoader2 size={16} className="animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        }
      >
        <form id={`editar-local-${tenantId}`} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CasillasDocumentosLocal
            resolucionSanitaria={Boolean(watch("resolucion_sanitaria_presentada"))}
            patenteComercial={Boolean(watch("patente_comercial_al_dia"))}
            onResolucionSanitaria={(valor) =>
              setValue("resolucion_sanitaria_presentada", valor, { shouldDirty: true })
            }
            onPatenteComercial={(valor) => setValue("patente_comercial_al_dia", valor, { shouldDirty: true })}
          />
          <div>
            <Label htmlFor={`nombre-${tenantId}`}>Nombre</Label>
            <input id={`nombre-${tenantId}`} className={CAMPO} {...register("nombre")} />
            {errors.nombre && <p className="text-xs text-[#B42318] mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor={`direccion-${tenantId}`}>Dirección</Label>
            <input id={`direccion-${tenantId}`} className={CAMPO} {...register("direccion")} />
            {errors.direccion && <p className="text-xs text-[#B42318] mt-1">{errors.direccion.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`ciudad-${tenantId}`}>Ciudad</Label>
              <input id={`ciudad-${tenantId}`} className={CAMPO} {...register("ciudad")} />
              {errors.ciudad && <p className="text-xs text-[#B42318] mt-1">{errors.ciudad.message}</p>}
            </div>
            <div>
              <Label htmlFor={`tel-${tenantId}`}>Teléfono</Label>
              <input id={`tel-${tenantId}`} className={CAMPO} {...register("telefono")} />
              {errors.telefono && <p className="text-xs text-[#B42318] mt-1">{errors.telefono.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor={`tipo-${tenantId}`}>Rubro</Label>
            <select id={`tipo-${tenantId}`} className={CAMPO} {...register("tipo_local")}>
              {TIPOS_LOCAL.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_LOCAL_LABEL[tipo]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`enc-${tenantId}`}>Encargado</Label>
              <input id={`enc-${tenantId}`} className={CAMPO} {...register("encargado_nombre")} />
            </div>
            <div>
              <Label htmlFor={`enc-tel-${tenantId}`}>Teléfono del encargado</Label>
              <input id={`enc-tel-${tenantId}`} className={CAMPO} {...register("encargado_telefono")} />
              {errors.encargado_telefono && (
                <p className="text-xs text-[#B42318] mt-1">{errors.encargado_telefono.message}</p>
              )}
            </div>
          </div>
          {actualizar.error && (
            <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2" role="alert">
              {actualizar.error.message}
            </p>
          )}
        </form>
      </Dialogo>
    </>
  );
}
