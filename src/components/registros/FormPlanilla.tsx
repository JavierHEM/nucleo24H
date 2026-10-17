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

function fechaHoy() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function horaAhora() {
  const ahora = new Date();
  const total = ahora.getHours() * 60 + ahora.getMinutes();
  const redondeado = Math.round(total / 5) * 5;
  const minutos = ((redondeado % (24 * 60)) + 24 * 60) % (24 * 60);
  const hora = String(Math.floor(minutos / 60)).padStart(2, "0");
  const minuto = String(minutos % 60).padStart(2, "0");
  return `${hora}:${minuto}`;
}

const HORAS = Array.from({ length: 24 }, (_, hora) => String(hora).padStart(2, "0"));
const MINUTOS = Array.from({ length: 12 }, (_, paso) => String(paso * 5).padStart(2, "0"));

function CampoHora({
  id,
  valor,
  onChange,
}: {
  id: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  const actual = /^\d{2}:\d{2}$/.test(valor) ? valor : horaAhora();
  const [hora, minuto] = actual.split(":");
  const minutos = MINUTOS.includes(minuto) ? MINUTOS : [...MINUTOS, minuto].sort();

  function escribir(siguienteHora: string, siguienteMinuto: string) {
    onChange(`${siguienteHora}:${siguienteMinuto}`);
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <select
        id={id}
        aria-label="Hora"
        value={hora}
        onChange={(event) => escribir(event.target.value, minuto)}
        className="min-h-12 flex-1 rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        {HORAS.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      <span className="text-[#5B6980]" aria-hidden>
        :
      </span>
      <select
        aria-label="Minutos"
        value={minuto}
        onChange={(event) => escribir(hora, event.target.value)}
        className="min-h-12 flex-1 rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        {minutos.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange(horaAhora())}
        className="min-h-12 shrink-0 rounded-xl border border-[#DDE3EA] px-3 text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        Ahora
      </button>
    </div>
  );
}

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
  for (const campo of planilla.campos) {
    if (campo.tipo === "date") defaults[campo.key] = fechaHoy();
    if (campo.tipo === "time") defaults[campo.key] = horaAhora();
  }

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
        <p className="font-mono text-xs text-[#5B6980]">{planilla.codigo}</p>
        <p className="text-xs text-[#5B6980] mt-1">{planilla.frecuencia}</p>
        {guiaDe(planilla.codigo) && (
          <p className="text-sm text-[#334155] mt-2">{guiaDe(planilla.codigo)?.mirar}</p>
        )}
        {tieneDesviacion(watch()) && (
          <p className="text-sm text-[#B45309] mt-2">Esto queda con observación. Anota la acción correctiva.</p>
        )}
      </div>

      {crear.error && (
        <p className="text-sm text-[#B42318] bg-red-50 rounded-lg px-3 py-2">{crear.error.message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {planilla.campos.map((campo) => {
          if (campo.tipo === "asistentes" || campo.tipo === "textarea") return null;
          const id = `${planilla.codigo}-${campo.key}`;
          return (
            <div
              key={campo.key}
              className={campo.tipo === "equipo" || campo.tipo === "area" || campo.tipo === "time" ? "sm:col-span-2" : ""}
            >
              <Label htmlFor={id}>{campo.label}</Label>
              {campo.tipo === "equipo" && equipos.length > 0 ? (
                <select
                  id={id}
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm"
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
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm"
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
                  className="mt-1 flex min-h-12 w-full rounded-xl border border-[#DDE3EA] bg-white px-3 text-sm"
                  {...register(campo.key)}
                >
                  <option value="">Selecciona</option>
                  {campo.opciones.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              ) : campo.tipo === "date" ? (
                <div className="mt-1 flex items-center gap-2">
                  <Input id={id} type="date" className="min-h-12 flex-1" {...register(campo.key)} />
                  <button
                    type="button"
                    onClick={() => setValue(campo.key, fechaHoy(), { shouldValidate: true })}
                    className="min-h-12 shrink-0 rounded-xl border border-[#DDE3EA] px-3 text-sm font-medium text-[#16294A] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
                  >
                    Hoy
                  </button>
                </div>
              ) : campo.tipo === "time" ? (
                <CampoHora
                  id={id}
                  valor={String(watch(campo.key) ?? "")}
                  onChange={(valor) => setValue(campo.key, valor, { shouldValidate: true })}
                />
              ) : campo.tipo === "number" ? (
                <div className="mt-1 flex items-center gap-2 min-h-14 rounded-xl border-2 border-[#0B1B33] bg-[#F4F6F3] px-4">
                  <Input
                    id={id}
                    type="number"
                    step="0.1"
                    className="border-0 bg-transparent shadow-none px-0 h-12 font-mono text-3xl font-semibold focus-visible:ring-0"
                    {...register(campo.key, { valueAsNumber: true })}
                  />
                  {"unidad" in campo && campo.unidad && (
                    <span className="font-mono text-base text-[#5B6980] shrink-0">{campo.unidad}</span>
                  )}
                </div>
              ) : (
                <Input
                  id={id}
                  type="text"
                  placeholder={"placeholder" in campo ? campo.placeholder : undefined}
                  className="mt-1 min-h-12"
                  {...register(campo.key)}
                />
              )}
              {errorDe(campo.key) && <p className="text-xs text-[#B42318] mt-1">{errorDe(campo.key)}</p>}
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
              className="mt-1 w-full rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B2A]"
              {...register(campo.key)}
            />
            {errorDe(campo.key) && <p className="text-xs text-[#B42318] mt-1">{errorDe(campo.key)}</p>}
          </div>
        ))}

      {planilla.items && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#0B1B33]">Ítems</legend>
          {errorDe("items") && <p className="text-xs text-[#B42318]">{errorDe("items")}</p>}
          <ul className="space-y-2">
            {planilla.items.map((item, index) => (
              <li key={item} className="rounded-xl border border-[#DDE3EA] p-3">
                <p className="text-sm text-[#0B1B33]">
                  <span className="font-mono text-xs text-[#5B6980] mr-2">{String(index + 1).padStart(2, "0")}</span>
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
                          ? "bg-[#16294A] text-white border-[#16294A]"
                          : "border-[#DDE3EA] text-[#334155]"
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
              className="mt-1 w-full rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm"
              {...register("accion")}
            />
            {errorDe("accion") && <p className="text-xs text-[#B42318] mt-1">{errorDe("accion")}</p>}
          </div>
        </fieldset>
      )}

      {planilla.campos.some((campo) => campo.tipo === "asistentes") && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[#0B1B33]">Asistentes</legend>
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
                className="min-h-12 px-3 text-[#5B6980]"
                aria-label="Quitar asistente"
                disabled={asistentes.fields.length === 1}
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))}
          {errorDe("asistentes") && <p className="text-xs text-[#B42318]">{errorDe("asistentes")}</p>}
          <button
            type="button"
            onClick={() => asistentes.append({ nombre: "", cargo: "", evaluacion: "" })}
            className="inline-flex items-center gap-1 text-sm text-[#16294A]"
          >
            <IconPlus size={14} />
            Agregar asistente
          </button>
        </fieldset>
      )}

      <Button
        type="submit"
        disabled={crear.isPending}
        className="w-full min-h-12 bg-[#2F6B2A] hover:bg-[#255620] text-white"
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
