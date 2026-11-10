"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { claveRut } from "@/lib/empresas";
import { altaEmpresaSchema, type AltaEmpresaInput } from "@/lib/locales/ficha";
import { PLAN_IDS, PLANES, PLAN_PRECIOS_CLP, TIPOS_LOCAL, TIPO_LOCAL_LABEL } from "@/lib/planes";
import { formatCLP } from "@/lib/utils";

const CAMPO =
  "mt-1 w-full min-w-0 min-h-12 rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]";

const SECCION = "text-xs font-semibold uppercase tracking-wide text-[#5B6980]";

const PASOS = [
  { id: 1, titulo: "Ficha de la empresa" },
  { id: 2, titulo: "Casa matriz" },
  { id: 3, titulo: "Plan e invitación" },
] as const;

export function NuevaEmpresaAsistente() {
  const [paso, setPaso] = useState(1);
  const router = useRouter();
  const crear = trpc.empresas.crear.useMutation();

  const {
    register,
    trigger,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AltaEmpresaInput>({
    resolver: zodResolver(altaEmpresaSchema),
    defaultValues: {
      empresa: {
        razon_social: "",
        rut: "",
        giro: "",
        domicilio_legal: "",
        telefono: "",
        email: "",
        representante_legal_nombre: "",
        representante_legal_rut: "",
        representante_legal_telefono: "",
        notas_internas: "",
      },
      local: {
        nombre: "",
        direccion: "",
        ciudad: "Osorno",
        telefono: "",
        tipo_local: "restaurante",
        encargado_nombre: "",
        encargado_telefono: "",
      },
      plan: "calidad",
      email_admin: "",
    },
  });

  const plan = watch("plan");

  async function siguiente() {
    const ok = await trigger(paso === 1 ? "empresa" : "local");
    if (ok) setPaso((actual) => actual + 1);
  }

  async function onSubmit(data: AltaEmpresaInput) {
    const resultado = await crear.mutateAsync(data);
    router.push(`/admin/locales/${encodeURIComponent(claveRut(resultado.empresa.rut))}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link
          href="/admin/locales"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
        >
          <IconArrowLeft size={16} />
          Empresas
        </Link>
        <h1 className="text-2xl font-bold text-[#0B1B33] mt-3">Nueva empresa</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          La casa matriz queda creada ahora y se habilita cuando registres el primer pago.
        </p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {PASOS.map((item) => (
            <li
              key={item.id}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                paso === item.id
                  ? "bg-[#2F6B2A] text-white"
                  : paso > item.id
                    ? "bg-[#E5F1E3] text-[#255620]"
                    : "bg-white border border-[#DDE3EA] text-[#5B6980]"
              }`}
            >
              {item.id}. {item.titulo}
            </li>
          ))}
        </ol>
      </div>

      {paso === 1 && (
        <div className="rounded-2xl border border-[#DDE3EA] bg-white p-5 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4 min-w-0">
            <h2 className={SECCION}>Identidad</h2>
            <div>
              <Label htmlFor="razon-social">Razón social</Label>
              <Input id="razon-social" className={CAMPO} {...register("empresa.razon_social")} />
              {errors.empresa?.razon_social && (
                <p className="text-xs text-[#B42318] mt-1">{errors.empresa.razon_social.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <Label htmlFor="rut-empresa">RUT</Label>
                <Input id="rut-empresa" placeholder="12.345.678-9" className={CAMPO} {...register("empresa.rut")} />
                {errors.empresa?.rut && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.empresa.rut.message}</p>
                )}
              </div>
              <div className="min-w-0">
                <Label htmlFor="giro">Giro (opcional)</Label>
                <Input id="giro" className={CAMPO} {...register("empresa.giro")} />
              </div>
            </div>
            <div>
              <Label htmlFor="domicilio">Domicilio legal (opcional)</Label>
              <Input id="domicilio" className={CAMPO} {...register("empresa.domicilio_legal")} />
              <p className="text-xs text-[#5B6980] mt-1">Si lo dejas vacío, usamos la dirección de la casa matriz.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <Label htmlFor="tel-empresa">Teléfono de la empresa</Label>
                <Input id="tel-empresa" className={CAMPO} {...register("empresa.telefono")} />
                {errors.empresa?.telefono && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.empresa.telefono.message}</p>
                )}
              </div>
              <div className="min-w-0">
                <Label htmlFor="email-empresa">Email de la empresa (opcional)</Label>
                <Input id="email-empresa" type="email" className={CAMPO} {...register("empresa.email")} />
                {errors.empresa?.email && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.empresa.email.message}</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4 min-w-0 lg:border-l lg:border-[#DDE3EA] lg:pl-8">
            <h2 className={SECCION}>Representante legal</h2>
            <div>
              <Label htmlFor="repr-nombre">Nombre</Label>
              <Input id="repr-nombre" className={CAMPO} {...register("empresa.representante_legal_nombre")} />
              {errors.empresa?.representante_legal_nombre && (
                <p className="text-xs text-[#B42318] mt-1">{errors.empresa.representante_legal_nombre.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <Label htmlFor="repr-rut">RUT del representante</Label>
                <Input id="repr-rut" className={CAMPO} {...register("empresa.representante_legal_rut")} />
                {errors.empresa?.representante_legal_rut && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.empresa.representante_legal_rut.message}</p>
                )}
              </div>
              <div className="min-w-0">
                <Label htmlFor="repr-tel">Teléfono (opcional)</Label>
                <Input id="repr-tel" className={CAMPO} {...register("empresa.representante_legal_telefono")} />
                {errors.empresa?.representante_legal_telefono && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.empresa.representante_legal_telefono.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="notas">Notas internas de Núcleo (opcional)</Label>
              <textarea id="notas" rows={5} className={`${CAMPO} min-h-28`} {...register("empresa.notas_internas")} />
              <p className="text-xs text-[#5B6980] mt-1">No se muestra al local.</p>
            </div>
          </section>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="rounded-2xl border border-[#DDE3EA] bg-white p-5 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4 min-w-0">
            <h2 className={SECCION}>El local</h2>
            <div>
              <Label htmlFor="nombre-local">Nombre de fantasía de la casa matriz</Label>
              <Input id="nombre-local" className={CAMPO} {...register("local.nombre")} />
              {errors.local?.nombre && <p className="text-xs text-[#B42318] mt-1">{errors.local.nombre.message}</p>}
            </div>
            <div>
              <Label htmlFor="dir-local">Dirección</Label>
              <Input id="dir-local" className={CAMPO} {...register("local.direccion")} />
              {errors.local?.direccion && (
                <p className="text-xs text-[#B42318] mt-1">{errors.local.direccion.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <Label htmlFor="ciudad-local">Ciudad</Label>
                <Input id="ciudad-local" className={CAMPO} {...register("local.ciudad")} />
                {errors.local?.ciudad && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.local.ciudad.message}</p>
                )}
              </div>
              <div className="min-w-0">
                <Label htmlFor="tel-local">Teléfono del local</Label>
                <Input id="tel-local" className={CAMPO} {...register("local.telefono")} />
                {errors.local?.telefono && (
                  <p className="text-xs text-[#B42318] mt-1">{errors.local.telefono.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="tipo-local">Rubro</Label>
              <select id="tipo-local" className={CAMPO} {...register("local.tipo_local")}>
                {TIPOS_LOCAL.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {TIPO_LOCAL_LABEL[tipo]}
                  </option>
                ))}
              </select>
            </div>
          </section>
          <section className="space-y-4 min-w-0 lg:border-l lg:border-[#DDE3EA] lg:pl-8">
            <h2 className={SECCION}>Encargado del local</h2>
            <div>
              <Label htmlFor="enc-nombre">Nombre (opcional)</Label>
              <Input id="enc-nombre" className={CAMPO} {...register("local.encargado_nombre")} />
            </div>
            <div>
              <Label htmlFor="enc-tel">Teléfono (opcional)</Label>
              <Input id="enc-tel" className={CAMPO} {...register("local.encargado_telefono")} />
              {errors.local?.encargado_telefono && (
                <p className="text-xs text-[#B42318] mt-1">{errors.local.encargado_telefono.message}</p>
              )}
            </div>
            <p className="text-sm text-[#5B6980]">
              Si aún no hay encargado, déjalo vacío. Puedes completarlo después en la ficha del local.
            </p>
          </section>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="rounded-2xl border border-[#DDE3EA] bg-white p-5 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4 min-w-0">
            <h2 className={SECCION}>Plan de la casa matriz</h2>
            <p className="text-sm text-[#334155]">
              Queda creado ahora y se habilita con el primer pago. Cada sucursal posterior tiene su propio plan.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLAN_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setValue("plan", id)}
                  className={`rounded-xl border-2 p-4 text-left text-sm font-medium min-h-20 ${
                    plan === id
                      ? "border-[#2F6B2A] bg-[#E5F1E3] text-[#255620]"
                      : "border-[#DDE3EA] text-[#5B6980] hover:border-[#2F6B2A]/50"
                  }`}
                >
                  {PLANES[id].nombre}
                  <span className="mt-1 block text-[11px] font-normal">
                    {formatCLP(PLAN_PRECIOS_CLP[id])} / mes
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="space-y-4 min-w-0 lg:border-l lg:border-[#DDE3EA] lg:pl-8">
            <h2 className={SECCION}>Invitación (opcional)</h2>
            <p className="text-sm text-[#334155]">
              Puedes cargar la ficha ahora y enviarle el acceso al dueño después.
            </p>
            <div>
              <Label htmlFor="email-admin">Email del administrador del local</Label>
              <Input id="email-admin" type="email" className={CAMPO} {...register("email_admin")} />
              {errors.email_admin && (
                <p className="text-xs text-[#B42318] mt-1">{errors.email_admin.message}</p>
              )}
            </div>
          </section>
          </div>
        </div>
      )}

      {crear.error && (
        <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2" role="alert">
          {crear.error.message}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
        {paso > 1 ? (
          <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={() => setPaso((p) => p - 1)}>
            Atrás
          </Button>
        ) : (
          <Button type="button" variant="outline" className="min-h-12 rounded-xl" asChild>
            <Link href="/admin/locales">Cancelar</Link>
          </Button>
        )}
        {paso < 3 ? (
          <Button
            type="button"
            onClick={siguiente}
            className="min-h-12 rounded-xl bg-[#2F6B2A] hover:bg-[#255620] text-white"
          >
            Continuar
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={crear.isPending}
            className="min-h-12 rounded-xl bg-[#2F6B2A] hover:bg-[#255620] text-white"
          >
            {crear.isPending && <IconLoader2 size={16} className="animate-spin" />}
            Crear empresa
          </Button>
        )}
      </div>
    </form>
  );
}
