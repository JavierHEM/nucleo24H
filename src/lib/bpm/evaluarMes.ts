import { tieneDesviacion } from "@/lib/bpm/planillas";
import {
  armarAgenda,
  diaEnChile,
  inicioSemanaChile,
  type EstadoAgenda,
  type ItemPrograma,
} from "@/lib/bpm/programa";
import type { Hallazgo } from "@/server/sello-engine/tipos";

export type RegistroMes = {
  codigo: string | null;
  tipo?: string;
  fecha: Date | string;
  datos: unknown;
};

export function diasEvaluables(periodo: string, ahora = new Date()) {
  const hoy = diaEnChile(ahora);
  const ultimo = new Date(Date.UTC(Number(periodo.slice(0, 4)), Number(periodo.slice(5, 7)), 0)).getUTCDate();
  const dias: string[] = [];
  for (let dia = 1; dia <= ultimo; dia += 1) {
    const iso = `${periodo}-${String(dia).padStart(2, "0")}`;
    if (iso > hoy) break;
    dias.push(iso);
  }
  return dias;
}

export function instanteDelDia(iso: string) {
  return new Date(`${iso}T18:00:00.000Z`);
}

export function normalizarRegistro(registro: RegistroMes): RegistroMes {
  if (registro.codigo) return registro;
  if (registro.tipo === "temperatura") return { ...registro, codigo: "R-BPM-05-02" };
  if (registro.tipo === "limpieza") return { ...registro, codigo: "R-BPM-02-02" };
  if (registro.tipo === "plagas") return { ...registro, codigo: "R-BPM-03-02" };
  if (registro.tipo === "capacitacion") return { ...registro, codigo: "R-BPM-10-04" };
  return registro;
}

export function evaluarProgramaDelMes(input: {
  programa: ItemPrograma[];
  registros: RegistroMes[];
  equipos: string[];
  periodo: string;
  ahora?: Date;
}) {
  const registros = input.registros.map(normalizarRegistro);
  const dias = diasEvaluables(input.periodo, input.ahora);
  const diarios = input.programa.filter((item) => item.activa && item.modo === "turno" && item.cadencia === "dia");
  const semanales = input.programa.filter((item) => item.activa && item.modo === "turno" && item.cadencia === "semana");
  const eventos = input.programa.filter((item) => item.activa && item.modo === "evento");

  const estados: EstadoAgenda[] = [];
  const conteo = new Map<string, { nombre: string; pendiente: number; observacion: number; unidad: "día" | "semana" }>();

  function sumar(codigo: string, nombre: string, estado: EstadoAgenda, unidad: "día" | "semana") {
    estados.push(estado);
    const actual = conteo.get(`${unidad}:${codigo}`) ?? { nombre, pendiente: 0, observacion: 0, unidad };
    if (estado === "pendiente") actual.pendiente += 1;
    if (estado === "observacion") actual.observacion += 1;
    conteo.set(`${unidad}:${codigo}`, actual);
  }

  for (const iso of dias) {
    const agenda = armarAgenda({
      programa: diarios,
      registros,
      equipos: input.equipos,
      ahora: instanteDelDia(iso),
    });
    for (const item of agenda.hoy) sumar(item.codigo, item.nombre, item.estado, "día");
  }

  const ultimaPorSemana = new Map<string, string>();
  for (const iso of dias) {
    ultimaPorSemana.set(inicioSemanaChile(instanteDelDia(iso)), iso);
  }
  for (const iso of ultimaPorSemana.values()) {
    const agenda = armarAgenda({
      programa: semanales,
      registros,
      equipos: input.equipos,
      ahora: instanteDelDia(iso),
    });
    for (const item of agenda.hoy) sumar(item.codigo, item.nombre, item.estado, "semana");
  }

  let eventosSinAccion = 0;
  const eventosNombrados = new Set<string>();
  const inicio = `${input.periodo}-01`;
  const fin = dias[dias.length - 1] ?? inicio;
  for (const item of eventos) {
    const ocurrio = registros.some((registro) => {
      if (registro.codigo !== item.codigo) return false;
      const dia = diaEnChile(new Date(registro.fecha));
      if (dia < inicio || dia > fin) return false;
      return sinAccion(registro.datos);
    });
    if (!ocurrio) continue;
    eventosSinAccion += 1;
    eventosNombrados.add(item.nombre);
  }

  const hallazgos: Hallazgo[] = [];
  for (const item of conteo.values()) {
    if (item.pendiente > 0) {
      hallazgos.push({ dimension: "condiciones", texto: frase(item.nombre, item.pendiente, item.unidad, "pendiente") });
    }
    if (item.observacion > 0) {
      hallazgos.push({ dimension: "condiciones", texto: frase(item.nombre, item.observacion, item.unidad, "observacion") });
    }
  }
  for (const nombre of eventosNombrados) {
    hallazgos.push({ dimension: "condiciones", texto: `${nombre} quedó sin acción correctiva.` });
  }

  return { estados, eventosSinAccion, hallazgos };
}

function frase(nombre: string, cantidad: number, unidad: "día" | "semana", tipo: "pendiente" | "observacion") {
  const plural = cantidad === 1 ? unidad : unidad === "día" ? "días" : "semanas";
  if (tipo === "pendiente") return `Faltó ${nombre} en ${cantidad} ${plural}.`;
  return `${nombre} quedó con observación en ${cantidad} ${plural}.`;
}

function sinAccion(datos: unknown) {
  if (!tieneDesviacion(datos)) return false;
  if (!datos || typeof datos !== "object") return true;
  const accion = (datos as { accion?: unknown }).accion;
  return typeof accion !== "string" || accion.trim().length < 2;
}
