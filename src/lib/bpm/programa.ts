import { z } from "zod";
import { getPlanilla, tieneDesviacion } from "@/lib/bpm/planillas";
import type { TipoLocal } from "@/lib/planes";

export const MOMENTOS = ["inicio", "durante", "cierre"] as const;
export const CADENCIAS = ["dia", "semana"] as const;
export const MODOS = ["turno", "evento"] as const;

export type Momento = (typeof MOMENTOS)[number];
export type Cadencia = (typeof CADENCIAS)[number];
export type Modo = (typeof MODOS)[number];
export type EstadoAgenda = "pendiente" | "hecho" | "observacion";

type Definicion = {
  codigo: string;
  modo: Modo;
  cadencia: Cadencia;
  momento: Momento;
  porque: string;
  mirar: string;
  cuandoEvento?: string;
  activa: boolean;
};

const DEFINICIONES: Definicion[] = [
  {
    codigo: "R-BPM-05-02",
    modo: "turno",
    cadencia: "dia",
    momento: "inicio",
    porque: "Si el frío está fuera de límite, ese alimento no se puede usar.",
    mirar: "Anota la temperatura de cada equipo y compárala con el límite.",
    activa: true,
  },
  {
    codigo: "R-BPM-07-02",
    modo: "turno",
    cadencia: "dia",
    momento: "inicio",
    porque: "Sin agua de aspecto y olor normales no se manipula alimento.",
    mirar: "Revisa que haya agua, que se vea y huela normal, y que salga con presión.",
    activa: true,
  },
  {
    codigo: "R-BPM-02-02",
    modo: "turno",
    cadencia: "dia",
    momento: "durante",
    porque: "Una superficie sucia contamina lo que se prepara después.",
    mirar: "Registra el área, el producto usado y si el método se cumplió.",
    activa: true,
  },
  {
    codigo: "R-BPM-06-02",
    modo: "turno",
    cadencia: "dia",
    momento: "cierre",
    porque: "Los residuos abiertos en el área de trabajo atraen plagas.",
    mirar: "Confirma que el contenedor y el área quedaron limpios.",
    activa: true,
  },
  {
    codigo: "R-BPM-01-02",
    modo: "turno",
    cadencia: "semana",
    momento: "durante",
    porque: "La higiene se verifica observando el turno, sin anotar el nombre de cada persona.",
    mirar: "Observa el turno y marca cada ítem. Si alguien no cumple, escríbelo en la acción correctiva.",
    activa: true,
  },
  {
    codigo: "R-BPM-03-02",
    modo: "turno",
    cadencia: "semana",
    momento: "durante",
    porque: "Detectar una evidencia a tiempo evita que la plaga se instale.",
    mirar: "Recorre accesos, alimentos protegidos y la zona de residuos.",
    activa: true,
  },
  {
    codigo: "R-BPM-04-02",
    modo: "evento",
    cadencia: "dia",
    momento: "durante",
    porque: "Un insumo en mal estado no debe entrar a la cocina.",
    mirar: "Revisa proveedor, lote, envase y temperatura antes de aceptar.",
    cuandoEvento: "Cada vez que llega mercadería",
    activa: true,
  },
  {
    codigo: "R-BPM-01-03",
    modo: "evento",
    cadencia: "dia",
    momento: "durante",
    porque: "Una herida o un malestar puede contaminar el alimento.",
    mirar: "Anota a la persona, la condición y qué se hizo con el alimento expuesto.",
    cuandoEvento: "Si alguien está enfermo o se corta",
    activa: true,
  },
  {
    codigo: "R-BPM-03-03",
    modo: "evento",
    cadencia: "dia",
    momento: "durante",
    porque: "Un avistamiento se registra en el momento, no al final de la semana.",
    mirar: "Indica el lugar, qué viste y la acción inmediata.",
    cuandoEvento: "Si ves una plaga o una evidencia",
    activa: true,
  },
  {
    codigo: "R-BPM-03-05",
    modo: "evento",
    cadencia: "dia",
    momento: "durante",
    porque: "Después del servicio externo hay que comprobar que el local quedó apto.",
    mirar: "Guarda el certificado y la verificación posterior.",
    cuandoEvento: "Cuando viene la empresa de plagas",
    activa: true,
  },
  {
    codigo: "R-BPM-08-02",
    modo: "evento",
    cadencia: "dia",
    momento: "durante",
    porque: "El tiempo y la temperatura de cocción definen si el producto es seguro.",
    mirar: "Anota producto, etapa y la temperatura medida.",
    cuandoEvento: "Cuando preparas un producto",
    activa: true,
  },
  {
    codigo: "R-BPM-08-03",
    modo: "evento",
    cadencia: "dia",
    momento: "durante",
    porque: "Enfriar lento deja el alimento en temperatura de riesgo.",
    mirar: "Anota temperatura y hora al inicio y al final.",
    cuandoEvento: "Cuando enfrías o recalientas",
    activa: true,
  },
  {
    codigo: "R-BPM-10-04",
    modo: "evento",
    cadencia: "dia",
    momento: "durante",
    porque: "La asistencia queda como evidencia de la capacitación.",
    mirar: "Elige el procedimiento, el tema y anota a quienes asistieron.",
    cuandoEvento: "Cuando haces una capacitación",
    activa: true,
  },
];

// TODO(Núcleo): definir qué controles aplican por rubro. Mientras sea null, el botón
// "Aplicar base del rubro" no ofrece una base y cada local conserva su programa.
const BASE_POR_RUBRO: Record<TipoLocal, readonly string[] | null> = {
  restaurante: null,
  cafeteria: null,
  cocineria: null,
  food_truck: null,
};

export function baseDelRubro(tipo: TipoLocal): ReadonlySet<string> | null {
  const codigos = BASE_POR_RUBRO[tipo];
  return codigos ? new Set<string>(codigos) : null;
}

export const ajusteSchema = z.object({
  codigo: z.string(),
  activa: z.boolean(),
  modo: z.enum(MODOS),
  momento: z.enum(MOMENTOS),
  cadencia: z.enum(CADENCIAS),
});

export type AjustePrograma = z.infer<typeof ajusteSchema>;

export type ItemPrograma = Definicion & {
  nombre: string;
  cuando: string;
};

export type ItemAgenda = {
  codigo: string;
  nombre: string;
  cuando: string;
  porque: string;
  mirar: string;
  momento: Momento;
  modo: Modo;
  estado: EstadoAgenda;
  detalle?: string;
};

const ZONA = "America/Santiago";

export function diaEnChile(fecha: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

export function inicioSemanaChile(fecha: Date) {
  const [year, month, day] = diaEnChile(fecha).split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const weekday = cursor.getUTCDay();
  const delta = weekday === 0 ? 6 : weekday - 1;
  cursor.setUTCDate(cursor.getUTCDate() - delta);
  return cursor.toISOString().slice(0, 10);
}

export function textoCuando(item: Pick<Definicion, "modo" | "cadencia" | "momento" | "cuandoEvento">) {
  if (item.modo === "evento") return item.cuandoEvento ?? "Cuando ocurra";
  if (item.cadencia === "semana") return "Esta semana";
  if (item.momento === "inicio") return "Al inicio de la jornada";
  if (item.momento === "cierre") return "Al cierre";
  return "Durante el turno";
}

export function guiaDe(codigo: string) {
  return programaBase().find((item) => item.codigo === codigo) ?? null;
}

export function programaBase(): ItemPrograma[] {
  return DEFINICIONES.flatMap((item) => {
    const planilla = getPlanilla(item.codigo);
    if (!planilla) return [];
    return [{ ...item, nombre: planilla.nombre, cuando: textoCuando(item) }];
  });
}

export function programaResuelto(guardado: unknown): ItemPrograma[] {
  const ajustes = z.array(ajusteSchema).catch([]).parse(guardado);
  const porCodigo = new Map(ajustes.map((ajuste) => [ajuste.codigo, ajuste]));
  return programaBase().map((item) => {
    const ajuste = porCodigo.get(item.codigo);
    if (!ajuste) return item;
    const resuelto = {
      ...item,
      activa: ajuste.activa,
      modo: ajuste.modo,
      momento: ajuste.momento,
      cadencia: ajuste.cadencia,
    };
    return { ...resuelto, cuando: textoCuando(resuelto) };
  });
}

type RegistroAgenda = {
  codigo: string | null;
  fecha: Date | string;
  datos: unknown;
};

export function armarAgenda(input: {
  programa: ItemPrograma[];
  registros: RegistroAgenda[];
  equipos: string[];
  ahora?: Date;
}) {
  const ahora = input.ahora ?? new Date();
  const hoy = diaEnChile(ahora);
  const lunes = inicioSemanaChile(ahora);

  const hoyItems: ItemAgenda[] = [];
  const eventos: ItemAgenda[] = [];

  for (const item of input.programa) {
    if (!item.activa) continue;
    const delPeriodo = input.registros.filter((registro) => {
      if (registro.codigo !== item.codigo) return false;
      const dia = diaEnChile(new Date(registro.fecha));
      if (item.modo === "turno" && item.cadencia === "semana") return dia >= lunes && dia <= hoy;
      return dia === hoy;
    });
    const estado = estadoDe(item.codigo, delPeriodo, input.equipos);
    const fila: ItemAgenda = {
      codigo: item.codigo,
      nombre: item.nombre,
      cuando: item.cuando,
      porque: item.porque,
      mirar: item.mirar,
      momento: item.momento,
      modo: item.modo,
      estado: estado.estado,
      detalle: estado.detalle,
    };
    if (item.modo === "evento") eventos.push(fila);
    else hoyItems.push(fila);
  }

  return { hoy: hoyItems, eventos };
}

function estadoDe(codigo: string, registros: RegistroAgenda[], equipos: string[]) {
  if (codigo === "R-BPM-05-02" && equipos.length > 0) {
    const cubiertos = new Set(
      registros
        .map((registro) => {
          const datos = registro.datos;
          if (!datos || typeof datos !== "object") return "";
          return String((datos as { equipo?: unknown }).equipo ?? "");
        })
        .filter(Boolean)
    );
    const faltan = equipos.filter((equipo) => !cubiertos.has(equipo));
    const conObservacion = registros.some((registro) => tieneDesviacion(registro.datos));
    if (faltan.length === 0) {
      return { estado: (conObservacion ? "observacion" : "hecho") as EstadoAgenda };
    }
    return {
      estado: (conObservacion ? "observacion" : "pendiente") as EstadoAgenda,
      detalle: faltan.length === equipos.length ? undefined : `Falta ${faltan.join(", ")}`,
    };
  }

  if (registros.length === 0) return { estado: "pendiente" as const };
  if (registros.some((registro) => tieneDesviacion(registro.datos))) {
    return { estado: "observacion" as const };
  }
  return { estado: "hecho" as const };
}
