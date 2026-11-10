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
import { claveRut } from "@/lib/empresas";
import { empresaFichaSchema, type EmpresaFichaInput } from "@/lib/locales/ficha";

const CAMPO =
  "mt-1 w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]";

export function EditarEmpresaButton({
  empresa,
}: {
  empresa: {
    id: string;
    razon_social: string;
    rut: string;
    giro: string | null;
    domicilio_legal: string | null;
    telefono: string;
    email: string | null;
    representante_legal_nombre: string;
    representante_legal_rut: string;
    representante_legal_telefono: string | null;
    notas_internas: string | null;
  };
}) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();
  const actualizar = trpc.empresas.actualizar.useMutation();
  const rutOriginal = claveRut(empresa.rut);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmpresaFichaInput>({
    resolver: zodResolver(empresaFichaSchema),
    values: {
      razon_social: empresa.razon_social,
      rut: empresa.rut,
      giro: empresa.giro ?? "",
      domicilio_legal: empresa.domicilio_legal ?? "",
      telefono: empresa.telefono,
      email: empresa.email ?? "",
      representante_legal_nombre: empresa.representante_legal_nombre,
      representante_legal_rut: empresa.representante_legal_rut,
      representante_legal_telefono: empresa.representante_legal_telefono ?? "",
      notas_internas: empresa.notas_internas ?? "",
    },
  });

  function cerrar() {
    reset();
    setAbierto(false);
  }

  async function onSubmit(data: EmpresaFichaInput) {
    const actualizada = await actualizar.mutateAsync({ id: empresa.id, ...data });
    void utils.empresas.porRut.invalidate();
    void utils.locales.list.invalidate();
    cerrar();
    const rutNuevo = claveRut(actualizada.rut);
    if (rutNuevo !== rutOriginal) {
      router.push(`/admin/locales/${encodeURIComponent(rutNuevo)}`);
      return;
    }
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
        Editar ficha
      </button>

      <Dialogo
        abierto={abierto}
        titulo="Editar ficha de la empresa"
        onCerrar={cerrar}
        ancho="lg"
        pie={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={cerrar} disabled={actualizar.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={`editar-empresa-${empresa.id}`}
              disabled={actualizar.isPending}
              className="min-h-12 rounded-xl bg-[#2F6B2A] hover:bg-[#255620] text-white"
            >
              {actualizar.isPending && <IconLoader2 size={16} className="animate-spin" />}
              Guardar ficha
            </Button>
          </div>
        }
      >
        <form id={`editar-empresa-${empresa.id}`} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor={`razon-${empresa.id}`}>Razón social</Label>
            <input id={`razon-${empresa.id}`} className={CAMPO} {...register("razon_social")} />
            {errors.razon_social && <p className="text-xs text-[#B42318] mt-1">{errors.razon_social.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`rut-${empresa.id}`}>RUT</Label>
              <input id={`rut-${empresa.id}`} className={CAMPO} {...register("rut")} />
              <p className="text-xs text-[#5B6980] mt-1">Si cambia el RUT, todos los locales de esta empresa se actualizan.</p>
              {errors.rut && <p className="text-xs text-[#B42318] mt-1">{errors.rut.message}</p>}
            </div>
            <div>
              <Label htmlFor={`giro-${empresa.id}`}>Giro</Label>
              <input id={`giro-${empresa.id}`} className={CAMPO} {...register("giro")} />
            </div>
          </div>
          <div>
            <Label htmlFor={`dom-${empresa.id}`}>Domicilio legal</Label>
            <input id={`dom-${empresa.id}`} className={CAMPO} {...register("domicilio_legal")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`tel-${empresa.id}`}>Teléfono</Label>
              <input id={`tel-${empresa.id}`} className={CAMPO} {...register("telefono")} />
              {errors.telefono && <p className="text-xs text-[#B42318] mt-1">{errors.telefono.message}</p>}
            </div>
            <div>
              <Label htmlFor={`email-${empresa.id}`}>Email</Label>
              <input id={`email-${empresa.id}`} className={CAMPO} {...register("email")} />
              {errors.email && <p className="text-xs text-[#B42318] mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor={`repr-${empresa.id}`}>Representante legal</Label>
            <input id={`repr-${empresa.id}`} className={CAMPO} {...register("representante_legal_nombre")} />
            {errors.representante_legal_nombre && (
              <p className="text-xs text-[#B42318] mt-1">{errors.representante_legal_nombre.message}</p>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`repr-rut-${empresa.id}`}>RUT del representante</Label>
              <input id={`repr-rut-${empresa.id}`} className={CAMPO} {...register("representante_legal_rut")} />
              {errors.representante_legal_rut && (
                <p className="text-xs text-[#B42318] mt-1">{errors.representante_legal_rut.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`repr-tel-${empresa.id}`}>Teléfono del representante</Label>
              <input id={`repr-tel-${empresa.id}`} className={CAMPO} {...register("representante_legal_telefono")} />
              {errors.representante_legal_telefono && (
                <p className="text-xs text-[#B42318] mt-1">{errors.representante_legal_telefono.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor={`notas-${empresa.id}`}>Notas internas</Label>
            <textarea id={`notas-${empresa.id}`} rows={3} className={CAMPO} {...register("notas_internas")} />
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
