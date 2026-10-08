"use client";

import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  limiteDeEquipo,
  schemaDePlanilla,
  tieneDesviacion,
  type Planilla,
} from "@/lib/bpm/planillas";
import { guiaDe } from "@/lib/bpm/programa";

type Equipo = { id: string; nombre: string; limite_min?: number | null; limite_max?: number | null };
type Area = { id: string; nombre: string; producto?: string };

interface Props {
  planilla: Planilla;
  equipos: Equipo[];
  areas: Area[];
  onSuccess?: () => void;
}

type Valores = Record<string, unknown>;

function fechaDelRegistro(datos: Valores) {
  const fecha = String(datos.fecha ?? "");
  const horaRaw = datos.hora ?? datos.hora_inicio;
  const hora = typeof horaRaw === "string" && horaRaw.length >= 4 ? horaRaw : "12:00";
  const instante = new Date(`${fecha}T${hora}`);
  return Number.isNaN(instante.getTime()) ? new Date().toISOString() : instante.toISOString();
}

export function FormPlanilla({ planilla, equipos, areas, onSuccess }: Props) {
  const utils = trpc.useUtils();
  const schema = schemaDePlanilla(planilla);
  const crear = trpc.registros.crear.useMutation({
    onSuccess: () => {
      utils.registros.list.invalidate();
      onSuccess?.();
    },
  });

  const defaults: Valores = {
    items: planilla.items?.map(() => ""),
    asistentes: [{ nombre: "", cargo: "", evaluacion: "" }],
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(schema) as Resolver<Valores>,
    defaultValues: defaults,
  });

  const asistentes = useFieldArray({
    control,
    name: "asistentes" as never,
  });

  const items = (watch("items") as string[] | undefined) ?? [];

  async function onSubmit(datos: Valores) {
    await crear.mutateAsync({
      codigo: planilla.codigo,
      fecha: fechaDelRegistro(datos),
      datos,
    });
  }

  const errorDe = (key: string) => {
    const error = errors[key];
    return error && "message" in error ? String(error.message) : "";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <p className="font-mono text-xs text-[#64748B]">{planilla.codigo}</p>
        <p className="text-xs text-[#64748B] mt-1">{planilla.frecuencia}</p>
        {guiaDe(planilla.codigo) && (
          <p className="text-sm text-[#334155] mt-2">{guiaDe(planilla.codigo)?.mirar}</p>
        )}
        {tieneDesviacion(watch()) && (
          <p className="text-sm text-[#B45309] mt-2">Esto queda con observación. Anota la acción correctiva.</p>
        )}
      </div>

      {crear.error && (
        <p className="text-sm text-[#DC2626] bg-red-50 rounded-lg px-3 py-2">{crear.error.message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {planilla.campos.map((campo) => {
          if (campo.tipo === "asistentes" || campo.tipo === "textarea") return null;
          const id = `${planilla.codigo}-${campo.key}`;
          return (
            <div key={campo.key} className={campo.tipo === "equipo" || campo.tipo === "area" ? "sm:col-span-2" : ""}>
              <Label htmlFor={id}>{campo.label}</Label>
              {campo.tipo === "equipo" && equipos.length > 0 ? (
                <select
                  id={id}
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm"
                  {...register("equipo")}
                  onChange={(event) => {
                    const nombre = event.target.value;
                    setValue("equipo", nombre, { shouldValidate: true });
                    const equipo = equipos.find((item) => item.nombre === nombre);
                    if (equipo) setValue("limite", limiteDeEquipo(equipo), { shouldValidate: true });
                  }}
                >
                  <option value="">Selecciona el equipo</option>
                  {equipos.map((equipo) => (
                    <option key={equipo.id} value={equipo.nombre}>
                      {equipo.nombre}
                    </option>
                  ))}
                </select>
              ) : campo.tipo === "area" && areas.length > 0 ? (
                <select
                  id={id}
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm"
                  {...register("area")}
                  onChange={(event) => {
                    const nombre = event.target.value;
                    setValue("area", nombre, { shouldValidate: true });
                    const area = areas.find((item) => item.nombre === nombre);
                    if (area?.producto) setValue("producto", area.producto);
                  }}
                >
                  <option value="">Selecciona el área</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.nombre}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
              ) : campo.tipo === "select" ? (
                <select
                  id={id}
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm"
                  {...register(campo.key)}
                >
                  <option value="">Selecciona</option>
                  {campo.opciones.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={id}
                  type={campo.tipo === "number" ? "number" : campo.tipo === "date" || campo.tipo === "time" ? campo.tipo : "text"}
                  step={campo.tipo === "number" ? "0.1" : undefined}
                  placeholder={"placeholder" in campo ? campo.placeholder : undefined}
                  className="mt-1 min-h-12"
                  {...register(campo.key, campo.tipo === "number" ? { valueAsNumber: true } : undefined)}
                />
              )}
              {errorDe(campo.key) && <p className="text-xs text-[#DC2626] mt-1">{errorDe(campo.key)}</p>}
            </div>
          );
        })}
      </div>

      {planilla.campos
        .filter((campo) => campo.tipo === "textarea")
        .map((campo) => (
          <div key={campo.key}>
            <Label htmlFor={`${planilla.codigo}-${campo.key}`}>{campo.label}</Label>
            <textarea
              id={`${planilla.codigo}-${campo.key}`}
              rows={3}
              className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B8B2E]"
              {...register(campo.key)}
            />
            {errorDe(campo.key) && <p className="text-xs text-[#DC2626] mt-1">{errorDe(campo.key)}</p>}
          </div>
        ))}

      {planilla.items && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#0B2545]">Ítems</legend>
          {errorDe("items") && <p className="text-xs text-[#DC2626]">{errorDe("items")}</p>}
          <ul className="space-y-2">
            {planilla.items.map((item, index) => (
              <li key={item} className="rounded-xl border border-[#E2E8F0] p-3">
                <p className="text-sm text-[#0B2545]">
                  <span className="font-mono text-xs text-[#64748B] mr-2">{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={item}>
                  {(
                    [
                      ["cumple", "Cumple"],
                      ["no_cumple", "No cumple"],
                      ["na", "N/A"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={`text-xs rounded-full border px-3 py-1.5 cursor-pointer ${
                        items[index] === value
                          ? "bg-[#143556] text-white border-[#143556]"
                          : "border-[#E2E8F0] text-[#334155]"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        value={value}
                        {...register(`items.${index}`)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div>
            <Label htmlFor={`${planilla.codigo}-accion`}>Acción correctiva</Label>
            <textarea
              id={`${planilla.codigo}-accion`}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
              {...register("accion")}
            />
            {errorDe("accion") && <p className="text-xs text-[#DC2626] mt-1">{errorDe("accion")}</p>}
          </div>
        </fieldset>
      )}

      {planilla.campos.some((campo) => campo.tipo === "asistentes") && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[#0B2545]">Asistentes</legend>
          {asistentes.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                <Label htmlFor={`asistente-nombre-${index}`}>Nombre</Label>
                <Input id={`asistente-nombre-${index}`} className="mt-1 min-h-12" {...register(`asistentes.${index}.nombre`)} />
              </div>
              <div>
                <Label htmlFor={`asistente-cargo-${index}`}>Cargo</Label>
                <Input id={`asistente-cargo-${index}`} className="mt-1 min-h-12" {...register(`asistentes.${index}.cargo`)} />
              </div>
              <button
                type="button"
                onClick={() => asistentes.remove(index)}
                className="min-h-12 px-3 text-[#64748B]"
                aria-label="Quitar asistente"
                disabled={asistentes.fields.length === 1}
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))}
          {errorDe("asistentes") && <p className="text-xs text-[#DC2626]">{errorDe("asistentes")}</p>}
          <button
            type="button"
            onClick={() => asistentes.append({ nombre: "", cargo: "", evaluacion: "" })}
            className="inline-flex items-center gap-1 text-sm text-[#143556]"
          >
            <IconPlus size={14} />
            Agregar asistente
          </button>
        </fieldset>
      )}

      <Button
        type="submit"
        disabled={crear.isPending}
        className="w-full min-h-12 bg-[#4B8B2E] hover:bg-[#3A6E24] text-white"
      >
        {crear.isPending ? (
          <span className="inline-flex items-center gap-2">
            <IconLoader2 size={16} className="animate-spin" /> Guardando...
          </span>
        ) : (
          "Guardar registro"
        )}
      </Button>
    </form>
  );
}
