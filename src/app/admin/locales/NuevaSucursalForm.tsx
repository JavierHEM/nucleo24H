"use client";

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
import { altaSucursalSchema, type AltaSucursalInput } from "@/lib/locales/ficha";
import { PLAN_IDS, PLANES, PLAN_PRECIOS_CLP, TIPOS_LOCAL, TIPO_LOCAL_LABEL, normalizarPlan, normalizarTipoLocal } from "@/lib/planes";
import { formatCLP } from "@/lib/utils";

const CAMPO =
  "mt-1 w-full min-w-0 min-h-12 rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]";

const SECCION = "text-xs font-semibold uppercase tracking-wide text-[#5B6980]";

export function NuevaSucursalForm({
  casaCentralId,
  rut,
  razonSocial,
  representante,
  planActual,
  tipoLocalActual,
  ciudadActual,
}: {
  casaCentralId: string;
  rut: string;
  razonSocial: string;
  representante: string;
  planActual: string;
  tipoLocalActual: string;
  ciudadActual: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const crear = trpc.locales.crearSucursal.useMutation();
  const hrefEmpresa = `/admin/locales/${encodeURIComponent(claveRut(rut))}`;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AltaSucursalInput>({
    resolver: zodResolver(altaSucursalSchema),
    defaultValues: {
      casa_central_id: casaCentralId,
      nombre: "",
      direccion: "",
      ciudad: ciudadActual || "Osorno",
      telefono: "",
      tipo_local: normalizarTipoLocal(tipoLocalActual),
      encargado_nombre: "",
      encargado_telefono: "",
      plan: normalizarPlan(planActual),
      email_admin: "",
    },
  });

  const plan = watch("plan");

  async function onSubmit(data: AltaSucursalInput) {
    await crear.mutateAsync({
      casa_central_id: data.casa_central_id,
      nombre: data.nombre,
      direccion: data.direccion,
      ciudad: data.ciudad,
      telefono: data.telefono,
      tipo_local: data.tipo_local,
      encargado_nombre: data.encargado_nombre,
      encargado_telefono: data.encargado_telefono,
      plan: data.plan,
      email_admin: data.email_admin,
    });
    void utils.locales.list.invalidate();
    void utils.locales.porRut.invalidate();
    void utils.empresas.porRut.invalidate();
    router.push(hrefEmpresa);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link
          href={hrefEmpresa}
          className="inline-flex items-center gap-1 text-sm font-bold text-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
        >
          <IconArrowLeft size={16} />
          Volver a la empresa
        </Link>
        <h1 className="text-2xl font-bold text-[#0B1B33] mt-3">Nueva sucursal</h1>
        <p className="text-sm text-[#5B6980] mt-1">
          Mismo RUT y ficha legal. Este local tiene plan y suscripción propios; se habilita con el primer pago.
        </p>
        <p className="mt-3 text-sm text-[#334155]">
          <span className="font-semibold text-[#0B1B33]">{razonSocial}</span>
          <span className="text-[#5B6980]"> · RUT {rut}{representante ? ` · ${representante}` : ""}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-[#DDE3EA] bg-white p-5 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4 min-w-0">
          <h2 className={SECCION}>El local</h2>
          <div>
            <Label htmlFor="nombre-suc">Nombre de la sucursal</Label>
            <Input id="nombre-suc" className={CAMPO} {...register("nombre")} />
            {errors.nombre && <p className="text-xs text-[#B42318] mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="dir-suc">Dirección</Label>
            <Input id="dir-suc" className={CAMPO} {...register("direccion")} />
            {errors.direccion && <p className="text-xs text-[#B42318] mt-1">{errors.direccion.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label htmlFor="ciudad-suc">Ciudad</Label>
              <Input id="ciudad-suc" className={CAMPO} {...register("ciudad")} />
              {errors.ciudad && <p className="text-xs text-[#B42318] mt-1">{errors.ciudad.message}</p>}
            </div>
            <div className="min-w-0">
              <Label htmlFor="tel-suc">Teléfono del local</Label>
              <Input id="tel-suc" className={CAMPO} {...register("telefono")} />
              {errors.telefono && <p className="text-xs text-[#B42318] mt-1">{errors.telefono.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="tipo-suc">Rubro</Label>
            <select id="tipo-suc" className={CAMPO} {...register("tipo_local")}>
              {TIPOS_LOCAL.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_LOCAL_LABEL[tipo]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label htmlFor="enc-suc">Encargado (opcional)</Label>
              <Input id="enc-suc" className={CAMPO} {...register("encargado_nombre")} />
            </div>
            <div className="min-w-0">
              <Label htmlFor="enc-tel-suc">Teléfono del encargado (opcional)</Label>
              <Input id="enc-tel-suc" className={CAMPO} {...register("encargado_telefono")} />
              {errors.encargado_telefono && (
                <p className="text-xs text-[#B42318] mt-1">{errors.encargado_telefono.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 min-w-0 lg:border-l lg:border-[#DDE3EA] lg:pl-8">
          <h2 className={SECCION}>Plan e invitación</h2>
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
          <div>
            <Label htmlFor="email-suc">Invitar a otro encargado (opcional)</Label>
            <Input id="email-suc" type="email" className={CAMPO} {...register("email_admin")} />
            <p className="text-xs text-[#5B6980] mt-1">
              Los administradores de la casa matriz ya quedan vinculados a esta sucursal.
            </p>
            {errors.email_admin && <p className="text-xs text-[#B42318] mt-1">{errors.email_admin.message}</p>}
          </div>
        </section>
        </div>
      </div>

      {crear.error && (
        <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2" role="alert">
          {crear.error.message}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button type="button" variant="outline" className="min-h-12 rounded-xl" asChild>
          <Link href={hrefEmpresa}>Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={crear.isPending}
          className="min-h-12 rounded-xl bg-[#2F6B2A] hover:bg-[#255620] text-white"
        >
          {crear.isPending && <IconLoader2 size={16} className="animate-spin" />}
          Crear sucursal
        </Button>
      </div>
    </form>
  );
}
