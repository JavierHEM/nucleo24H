import { z } from "zod";
import { PROTOCOLOS } from "@/lib/bpm/biblioteca";

export const TIPOS_VISITA = ["programada", "sorpresa"] as const;
export const RESULTADOS_PAUTA = ["cumple", "observacion", "no_cumple", "no_revisada"] as const;

export type TipoVisita = (typeof TIPOS_VISITA)[number];
export type ResultadoPauta = (typeof RESULTADOS_PAUTA)[number];

export const ETIQUETA_RESULTADO: Record<ResultadoPauta, string> = {
  cumple: "Cumple",
  observacion: "Observación",
  no_cumple: "No cumple",
  no_revisada: "Sin revisar",
};

export const GRUPOS_PAUTA = [
  { id: "local", titulo: "Local" },
  { id: "bpm", titulo: "BPM" },
  { id: "poes", titulo: "POES" },
  { id: "poe", titulo: "POE" },
  { id: "seguimiento", titulo: "Visita anterior" },
] as const;

export type GrupoPauta = (typeof GRUPOS_PAUTA)[number]["id"];

export type PuntoPauta = {
  id: string;
  grupo: GrupoPauta;
  nombre: string;
  mirar: string;
  codigo?: string;
};

export const PAUTA_VISITA: PuntoPauta[] = [
  {
    id: "documentacion",
    grupo: "local",
    nombre: "Documentos del local",
    mirar: "Permiso sanitario, resoluciones y certificados vigentes y cargados.",
  },
  {
    id: "higiene",
    grupo: "bpm",
    codigo: "PR-BPM-01",
    nombre: "Higiene y salud del personal",
    mirar: "El turno se ve aseado, sin heridas expuestas, y la lista de la semana está hecha.",
  },
  {
    id: "capacitacion",
    grupo: "bpm",
    codigo: "PR-BPM-10",
    nombre: "Capacitación",
    mirar: "Hay una capacitación del mes y el personal conoce el procedimiento.",
  },
  {
    id: "limpieza",
    grupo: "poes",
    codigo: "PR-BPM-02",
    nombre: "Limpieza y sanitización",
    mirar: "Las áreas del programa están limpias y el registro del día existe.",
  },
  {
    id: "plagas",
    grupo: "poe",
    codigo: "PR-BPM-03",
    nombre: "Control de plagas",
    mirar: "Sin evidencias visibles. El monitoreo de la semana está registrado.",
  },
  {
    id: "recepcion",
    grupo: "poe",
    codigo: "PR-BPM-04",
    nombre: "Recepción",
    mirar: "Lo recibido se controló antes de entrar: proveedor, lote, envase y temperatura.",
  },
  {
    id: "almacenamiento",
    grupo: "poe",
    codigo: "PR-BPM-05",
    nombre: "Almacenamiento y frío",
    mirar: "Cada equipo está dentro del límite y los alimentos están protegidos.",
  },
  {
    id: "residuos",
    grupo: "poe",
    codigo: "PR-BPM-06",
    nombre: "Residuos",
    mirar: "Contenedores cerrados, área limpia y el retiro del día registrado.",
  },
  {
    id: "agua",
    grupo: "poe",
    codigo: "PR-BPM-07",
    nombre: "Agua",
    mirar: "Hay agua, se ve y huele normal, y sale con presión.",
  },
  {
    id: "produccion",
    grupo: "poe",
    codigo: "PR-BPM-08",
    nombre: "Producción",
    mirar: "La preparación y el enfriamiento, si hubo, quedaron registrados.",
  },
  {
    id: "trazabilidad",
    grupo: "poe",
    codigo: "PR-BPM-09",
    nombre: "Trazabilidad",
    mirar: "Se puede seguir un producto desde la recepción hasta la entrega.",
  },
  {
    id: "seguimiento",
    grupo: "seguimiento",
    nombre: "Pendientes de la visita anterior",
    mirar: "Las no conformidades abiertas ya tienen evidencia o siguen en plazo.",
  },
];

const IDS_PAUTA = PAUTA_VISITA.map((punto) => punto.id) as [string, ...string[]];

export const itemEvaluacionSchema = z.object({
  area: z.enum(IDS_PAUTA),
  resultado: z.enum(RESULTADOS_PAUTA),
  nota: z.string().trim().max(500).optional(),
  fecha_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ItemEvaluacion = z.infer<typeof itemEvaluacionSchema>;

export function puntoDe(id: string) {
  return PAUTA_VISITA.find((punto) => punto.id === id);
}

export function puntosDe(grupo: GrupoPauta) {
  return PAUTA_VISITA.filter((punto) => punto.grupo === grupo);
}

export function validarEvaluacion(tipo: TipoVisita, items: ItemEvaluacion[]): string | null {
  if (items.length !== PAUTA_VISITA.length) {
    return "La pauta está incompleta.";
  }
  const ids = new Set(items.map((item) => item.area));
  if (ids.size !== PAUTA_VISITA.length) {
    return "La pauta está incompleta.";
  }

  const revisados = items.filter((item) => item.resultado !== "no_revisada");
  if (tipo === "programada" && revisados.length !== PAUTA_VISITA.length) {
    return "En una visita programada hay que marcar cada punto.";
  }
  if (tipo === "sorpresa" && revisados.length === 0) {
    return "Marca al menos un punto de lo que viste.";
  }

  for (const item of items) {
    const punto = puntoDe(item.area);
    const nombre = punto?.nombre ?? item.area;
    const exigeNota = item.resultado === "observacion" || item.resultado === "no_cumple";
    if (exigeNota && (item.nota?.trim().length ?? 0) < 5) {
      return `Describe qué viste en ${nombre}.`;
    }
    if (item.resultado === "no_cumple" && !item.fecha_limite) {
      return `Indica la fecha límite de ${nombre}.`;
    }
  }

  return null;
}

export type NoConformidadVisita = {
  area: string;
  descripcion: string;
  severidad: "menor" | "mayor";
  fecha_limite?: string;
};

export function noConformidadesDe(items: ItemEvaluacion[]): NoConformidadVisita[] {
  return items.flatMap((item) => {
    if (item.resultado !== "observacion" && item.resultado !== "no_cumple") return [];
    const nota = item.nota?.trim() ?? "";
    if (nota.length < 5) return [];
    return [
      {
        area: item.area,
        descripcion: nota,
        severidad: item.resultado === "no_cumple" ? "mayor" : "menor",
        fecha_limite: item.fecha_limite,
      },
    ];
  });
}

export function leerEvaluacion(valor: unknown): ItemEvaluacion[] | null {
  const parsed = z.array(itemEvaluacionSchema).safeParse(valor);
  if (!parsed.success) return null;
  if (parsed.data.length !== PAUTA_VISITA.length) return null;
  return parsed.data;
}

export function codigosDeProtocoloEnPauta() {
  return PAUTA_VISITA.flatMap((punto) => (punto.codigo ? [punto.codigo] : []));
}

export function protocolosCubiertos() {
  const enPauta = new Set(codigosDeProtocoloEnPauta());
  return PROTOCOLOS.every((protocolo) => enPauta.has(protocolo.codigo));
}
