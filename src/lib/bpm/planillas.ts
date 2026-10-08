import { z } from "zod";

export const FAMILIAS = [
  { id: "higiene", label: "Higiene del personal", procedimiento: "PR-BPM-01" },
  { id: "limpieza", label: "Limpieza y sanitización", procedimiento: "PR-BPM-02" },
  { id: "plagas", label: "Control de plagas", procedimiento: "PR-BPM-03" },
  { id: "recepcion", label: "Recepción", procedimiento: "PR-BPM-04" },
  { id: "almacenamiento", label: "Almacenamiento", procedimiento: "PR-BPM-05" },
  { id: "residuos", label: "Residuos", procedimiento: "PR-BPM-06" },
  { id: "agua", label: "Agua potable", procedimiento: "PR-BPM-07" },
  { id: "produccion", label: "Producción", procedimiento: "PR-BPM-08" },
  { id: "capacitacion", label: "Capacitación", procedimiento: "PR-BPM-10" },
] as const;

export type FamiliaId = (typeof FAMILIAS)[number]["id"];

type CampoTexto = {
  key: string;
  label: string;
  tipo: "text" | "textarea";
  requerido?: boolean;
  placeholder?: string;
};

type CampoNumero = {
  key: string;
  label: string;
  tipo: "number";
  unidad?: string;
  requerido?: boolean;
};

type CampoFecha = {
  key: string;
  label: string;
  tipo: "date" | "time";
  requerido?: boolean;
};

type CampoSelect = {
  key: string;
  label: string;
  tipo: "select";
  opciones: Array<{ value: string; label: string }>;
  requerido?: boolean;
};

type CampoEquipo = { key: "equipo"; label: string; tipo: "equipo" };
type CampoArea = { key: "area"; label: string; tipo: "area" };
type CampoAsistentes = { key: "asistentes"; label: string; tipo: "asistentes" };

export type Campo =
  | CampoTexto
  | CampoNumero
  | CampoFecha
  | CampoSelect
  | CampoEquipo
  | CampoArea
  | CampoAsistentes;

export type Planilla = {
  codigo: string;
  nombre: string;
  familia: FamiliaId;
  frecuencia: string;
  campos: Campo[];
  items?: string[];
};

const SI_NO = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

const CUMPLE = [
  { value: "si", label: "Cumple" },
  { value: "no", label: "No cumple" },
];

export const PLANILLAS: Planilla[] = [
  {
    codigo: "R-BPM-01-02",
    nombre: "Lista de verificación de higiene del personal",
    familia: "higiene",
    frecuencia: "Según el programa del local; sugerido semanal y ante un hallazgo",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "turno", label: "Turno", tipo: "text" },
      { key: "responsable", label: "Responsable de la verificación", tipo: "text", requerido: true },
    ],
    items: [
      "Personal sin signos evidentes o informados de condición que comprometa la inocuidad.",
      "Ropa de trabajo limpia y adecuada.",
      "Cabello controlado o protegido según la actividad.",
      "Uñas cortas y limpias, sin elementos que dificulten la higiene.",
      "Sin joyas o accesorios que puedan contaminar o impedir un lavado eficaz.",
      "Manos limpias y lavado realizado en los momentos requeridos.",
      "Heridas correctamente protegidas cuando corresponda.",
      "Objetos personales fuera del área de manipulación.",
      "Uso de teléfono controlado y lavado de manos antes de retomar la manipulación.",
      "No se observan conductas antihigiénicas.",
      "Guantes, si se utilizan, limpios y correctamente cambiados.",
      "Visitas y contratistas cumplen las condiciones de ingreso.",
    ],
  },
  {
    codigo: "R-BPM-01-03",
    nombre: "Incidente de salud, herida o restricción",
    familia: "higiene",
    frecuencia: "Cada vez que ocurra",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "trabajador", label: "Trabajador", tipo: "text", requerido: true },
      { key: "cargo", label: "Cargo", tipo: "text", requerido: true },
      { key: "condicion", label: "Condición informada u observada", tipo: "textarea", requerido: true },
      {
        key: "riesgo",
        label: "¿Existe posible riesgo de contaminación?",
        tipo: "select",
        requerido: true,
        opciones: [
          { value: "si", label: "Sí" },
          { value: "no", label: "No" },
          { value: "evaluar", label: "Requiere evaluación" },
        ],
      },
      { key: "medida", label: "Medida adoptada", tipo: "textarea", requerido: true },
      { key: "alimentos", label: "Alimentos o superficies involucrados", tipo: "text" },
      { key: "accion", label: "Acción sobre alimentos o superficies", tipo: "textarea" },
      { key: "reingreso", label: "Condición para el reingreso", tipo: "text" },
    ],
  },
  {
    codigo: "R-BPM-02-02",
    nombre: "Registro de limpieza y sanitización",
    familia: "limpieza",
    frecuencia: "Según el programa maestro del local",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "turno", label: "Turno", tipo: "text" },
      { key: "area", label: "Área, equipo o utensilio", tipo: "area" },
      { key: "actividad", label: "Actividad realizada", tipo: "text", requerido: true },
      { key: "producto", label: "Producto", tipo: "text", requerido: true },
      { key: "cumple", label: "Cumple el método", tipo: "select", opciones: CUMPLE, requerido: true },
      { key: "ejecuta", label: "Ejecuta", tipo: "text", requerido: true },
      { key: "verifica", label: "Verifica", tipo: "text" },
      { key: "accion", label: "Observación o acción correctiva", tipo: "textarea" },
    ],
  },
  {
    codigo: "R-BPM-03-02",
    nombre: "Inspección y monitoreo interno de plagas",
    familia: "plagas",
    frecuencia: "Según la frecuencia definida por el local",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "turno", label: "Turno", tipo: "text" },
      { key: "responsable", label: "Responsable", tipo: "text", requerido: true },
    ],
    items: [
      "Accesos y puertas cierran adecuadamente.",
      "Ventanas y aberturas tienen protección contra vectores y están íntegras.",
      "No hay grietas, perforaciones o pasos sin sellar.",
      "No se observan insectos vivos o muertos en áreas críticas.",
      "No se observan fecas, roeduras, huellas, nidos u otras evidencias de roedores.",
      "No se observan aves u otras plagas en manipulación o almacenamiento.",
      "Alimentos y materias primas están protegidos y almacenados.",
      "No hay restos de alimentos ni derrames acumulados.",
      "Recipientes de residuos están cerrados, íntegros y limpios.",
      "La zona de residuos está limpia y sin evidencia de plagas.",
      "Desagües y zonas húmedas no favorecen plagas.",
      "El perímetro inmediato no acumula materiales ni refugios.",
      "Los puntos de monitoreo externos, si existen, están identificados e íntegros.",
      "No se almacenan plaguicidas en zonas de alimentos.",
    ],
  },
  {
    codigo: "R-BPM-03-03",
    nombre: "Avistamiento o evidencia de plaga",
    familia: "plagas",
    frecuencia: "Cada evento",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "persona", label: "Persona que informa", tipo: "text", requerido: true },
      { key: "area", label: "Área exacta", tipo: "text", requerido: true },
      {
        key: "evidencia",
        label: "Tipo de evidencia",
        tipo: "select",
        requerido: true,
        opciones: [
          { value: "avistamiento", label: "Avistamiento" },
          { value: "fecas", label: "Fecas" },
          { value: "roedura", label: "Roedura" },
          { value: "insecto_muerto", label: "Insecto muerto" },
          { value: "nido", label: "Nido" },
          { value: "otro", label: "Otro" },
        ],
      },
      {
        key: "plaga",
        label: "Plaga sospechada",
        tipo: "select",
        requerido: true,
        opciones: [
          { value: "roedor", label: "Roedor" },
          { value: "rastrero", label: "Insecto rastrero" },
          { value: "volador", label: "Insecto volador" },
          { value: "ave", label: "Ave" },
          { value: "otra", label: "Otra" },
        ],
      },
      { key: "descripcion", label: "Descripción y cantidad aproximada", tipo: "textarea", requerido: true },
      { key: "alimentos_expuestos", label: "¿Había alimentos o utensilios expuestos?", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "producto", label: "Producto potencialmente afectado", tipo: "text" },
      { key: "accion", label: "Acción inmediata", tipo: "textarea", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-03-05",
    nombre: "Servicio externo y verificación posterior",
    familia: "plagas",
    frecuencia: "Cada servicio",
    campos: [
      { key: "fecha", label: "Fecha del servicio", tipo: "date", requerido: true },
      { key: "empresa", label: "Empresa aplicadora", tipo: "text", requerido: true },
      { key: "certificado", label: "N° de certificado o informe", tipo: "text", requerido: true },
      { key: "plaga", label: "Plaga diagnosticada", tipo: "text", requerido: true },
      { key: "areas", label: "Áreas tratadas", tipo: "textarea", requerido: true },
      { key: "metodo", label: "Método o tratamiento informado", tipo: "text", requerido: true },
      { key: "productos", label: "Productos y N° de registro", tipo: "text" },
      { key: "reentrada", label: "Período de reentrada informado", tipo: "text" },
      { key: "proteccion", label: "Medidas de protección previas", tipo: "textarea" },
      { key: "verificacion", label: "Verificación posterior", tipo: "textarea", requerido: true },
      { key: "responsable", label: "Responsable del local", tipo: "text", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-04-02",
    nombre: "Recepción de materias primas e insumos",
    familia: "recepcion",
    frecuencia: "Cada recepción",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "proveedor", label: "Proveedor", tipo: "text", requerido: true },
      { key: "producto", label: "Producto", tipo: "text", requerido: true },
      { key: "lote", label: "Lote o vencimiento", tipo: "text", requerido: true },
      { key: "temperatura", label: "Temperatura", tipo: "number", unidad: "°C" },
      { key: "envase", label: "Envase íntegro", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "transporte", label: "Condición del transporte", tipo: "text", requerido: true },
      {
        key: "decision",
        label: "Decisión",
        tipo: "select",
        requerido: true,
        opciones: [
          { value: "acepta", label: "Acepta" },
          { value: "rechaza", label: "Rechaza" },
        ],
      },
      { key: "accion", label: "Acción u observación", tipo: "textarea" },
      { key: "responsable", label: "Responsable de recepción", tipo: "text", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-05-02",
    nombre: "Temperatura de equipos de frío",
    familia: "almacenamiento",
    frecuencia: "Según el programa del local; sugerido al inicio de la jornada",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "equipo", label: "Equipo", tipo: "equipo" },
      { key: "limite", label: "Límite definido", tipo: "text", requerido: true },
      { key: "temperatura", label: "Temperatura observada", tipo: "number", unidad: "°C", requerido: true },
      { key: "cumple", label: "Resultado", tipo: "select", opciones: CUMPLE, requerido: true },
      { key: "accion", label: "Acción correctiva", tipo: "textarea" },
      { key: "responsable", label: "Responsable", tipo: "text", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-06-02",
    nombre: "Retiro y limpieza de contenedores",
    familia: "residuos",
    frecuencia: "Según el programa; al cierre si quedan residuos en el área de trabajo",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora de retiro", tipo: "time", requerido: true },
      { key: "area", label: "Área o contenedor", tipo: "text", requerido: true },
      { key: "residuo", label: "Residuo retirado", tipo: "text", requerido: true },
      { key: "contenedor_limpio", label: "Contenedor limpio", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "area_limpia", label: "Área limpia", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "responsable", label: "Responsable", tipo: "text", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-07-02",
    nombre: "Verificación de abastecimiento de agua",
    familia: "agua",
    frecuencia: "Según el plan interno; sugerido por turno en puntos críticos",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "disponible", label: "Agua disponible", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "aspecto", label: "Aspecto normal", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "olor", label: "Olor normal", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "presion", label: "Presión o flujo adecuado", tipo: "select", opciones: SI_NO, requerido: true },
      { key: "accion", label: "Desviación o acción", tipo: "textarea" },
      { key: "responsable", label: "Responsable", tipo: "text", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-08-02",
    nombre: "Producción: tiempo y temperatura",
    familia: "produccion",
    frecuencia: "Según la ficha del producto",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "hora", label: "Hora", tipo: "time", requerido: true },
      { key: "turno", label: "Turno", tipo: "text" },
      { key: "producto", label: "Producto", tipo: "text", requerido: true },
      { key: "etapa", label: "Etapa", tipo: "text", requerido: true },
      { key: "lote", label: "Lote o fecha", tipo: "text" },
      { key: "temperatura_objetivo", label: "Temperatura objetivo", tipo: "number", unidad: "°C" },
      { key: "temperatura", label: "Temperatura medida", tipo: "number", unidad: "°C", requerido: true },
      { key: "tiempo", label: "Tiempo", tipo: "text", placeholder: "ej. 15 min" },
      { key: "resultado", label: "Resultado", tipo: "select", opciones: CUMPLE, requerido: true },
      { key: "accion", label: "Acción si no cumple", tipo: "textarea" },
      { key: "responsable", label: "Responsable", tipo: "text", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-08-03",
    nombre: "Enfriamiento y recalentamiento",
    familia: "produccion",
    frecuencia: "Cuando el proceso lo aplica",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "producto", label: "Producto", tipo: "text", requerido: true },
      { key: "hora_inicio", label: "Hora de inicio", tipo: "time", requerido: true },
      { key: "temperatura_inicio", label: "Temperatura de inicio", tipo: "number", unidad: "°C", requerido: true },
      { key: "control_1", label: "Control 1", tipo: "text" },
      { key: "control_2", label: "Control 2", tipo: "text" },
      { key: "hora_final", label: "Hora final", tipo: "time", requerido: true },
      { key: "temperatura_final", label: "Temperatura final", tipo: "number", unidad: "°C", requerido: true },
      { key: "resultado", label: "Resultado", tipo: "select", opciones: CUMPLE, requerido: true },
      { key: "accion", label: "Acción si no cumple", tipo: "textarea" },
      { key: "responsable", label: "Responsable", tipo: "text", requerido: true },
    ],
  },
  {
    codigo: "R-BPM-10-04",
    nombre: "Capacitación y asistencia",
    familia: "capacitacion",
    frecuencia: "Cada actividad. Sirve para los procedimientos PR-BPM-01 a PR-BPM-10",
    campos: [
      {
        key: "procedimiento",
        label: "Procedimiento",
        tipo: "select",
        requerido: true,
        opciones: FAMILIAS.map((f) => ({ value: f.procedimiento, label: `${f.procedimiento} ${f.label}` })),
      },
      { key: "tema", label: "Tema", tipo: "text", requerido: true },
      { key: "fecha", label: "Fecha", tipo: "date", requerido: true },
      { key: "duracion", label: "Duración", tipo: "text", placeholder: "ej. 30 min" },
      { key: "relator", label: "Relator", tipo: "text", requerido: true },
      { key: "asistentes", label: "Asistentes", tipo: "asistentes" },
    ],
  },
];

const texto = (requerido?: boolean) =>
  requerido ? z.string().trim().min(2, "Completa este campo") : z.string().trim().optional().or(z.literal(""));

export function schemaDePlanilla(planilla: Planilla) {
  const shape: Record<string, z.ZodType> = {};

  for (const campo of planilla.campos) {
    if (campo.tipo === "number") {
      const numero = z.number({ error: "Ingresa un número" });
      shape[campo.key] = z.preprocess(
        (value) => (value === "" || value === null || Number.isNaN(value) ? undefined : value),
        campo.requerido ? numero : numero.optional()
      );
    } else if (campo.tipo === "select") {
      const valores = campo.opciones.map((o) => o.value) as [string, ...string[]];
      shape[campo.key] = campo.requerido
        ? z.enum(valores, { error: "Selecciona una opción" })
        : z.enum(valores).optional();
    } else if (campo.tipo === "asistentes") {
      shape[campo.key] = z
        .array(
          z.object({
            nombre: z.string().trim().min(2, "Nombre del asistente"),
            cargo: z.string().trim().min(2, "Cargo del asistente"),
            evaluacion: z.string().trim().optional().or(z.literal("")),
          })
        )
        .min(1, "Agrega al menos un asistente");
    } else if (campo.tipo === "equipo" || campo.tipo === "area") {
      shape[campo.key] = z.string().trim().min(2, "Indica este dato");
    } else {
      shape[campo.key] = texto(campo.requerido);
    }
  }

  if (planilla.items) {
    shape.items = z
      .array(z.enum(["cumple", "no_cumple", "na"]))
      .length(planilla.items.length, "Responde todos los ítems");
    shape.accion = z.string().trim().optional().or(z.literal(""));
  }

  return z.object(shape).superRefine((data, ctx) => {
    const registro = data as Record<string, unknown>;
    const accion = typeof registro.accion === "string" ? registro.accion.trim() : "";
    if (tieneDesviacion(registro) && accion.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["accion"],
        message: "Describe la acción correctiva",
      });
    }
  });
}

export function tieneDesviacion(registro: unknown) {
  if (!registro || typeof registro !== "object") return false;
  const datos = registro as Record<string, unknown>;
  const marcaNo = [
    "disponible",
    "aspecto",
    "olor",
    "presion",
    "envase",
    "contenedor_limpio",
    "area_limpia",
  ].some((key) => datos[key] === "no");
  return (
    marcaNo ||
    datos.cumple === "no" ||
    datos.resultado === "no" ||
    datos.decision === "rechaza" ||
    datos.riesgo === "si" ||
    (Array.isArray(datos.items) && datos.items.includes("no_cumple"))
  );
}

export function getPlanilla(codigo: string) {
  return PLANILLAS.find((p) => p.codigo === codigo);
}

export function planillasDe(familia: FamiliaId) {
  return PLANILLAS.filter((p) => p.familia === familia);
}

export function etiquetaPlanilla(codigo: string | null | undefined, tipo: string) {
  const planilla = codigo ? getPlanilla(codigo) : undefined;
  if (planilla) return planilla.nombre;
  if (tipo === "temperatura") return "Temperatura";
  if (tipo === "limpieza") return "Limpieza";
  if (tipo === "plagas") return "Control de plagas";
  if (tipo === "capacitacion") return "Capacitación";
  return tipo;
}

export function resumenRegistro(
  codigo: string | null | undefined,
  tipo: string,
  datos: Record<string, unknown>
) {
  if (codigo === "R-BPM-05-02" || tipo === "temperatura") {
    if (codigo === "R-BPM-05-02") {
      return `${String(datos.equipo ?? "Equipo")} · ${String(datos.temperatura ?? "—")} °C · límite ${String(datos.limite ?? "—")}`;
    }
    return `Ingreso ${String(datos.temperatura_ingreso ?? "—")} °C · Almac. ${String(datos.temperatura_almacenamiento ?? "—")} °C`;
  }
  if (codigo === "R-BPM-02-02" || (tipo === "limpieza" && !codigo)) {
    if (codigo === "R-BPM-02-02") {
      return `${String(datos.area ?? "")} · ${String(datos.actividad ?? "")}`;
    }
    return `${String(datos.area ?? "")} · ${String(datos.producto_utilizado ?? "")}`;
  }
  if (codigo === "R-BPM-03-05" || (tipo === "plagas" && !codigo)) {
    if (!codigo) return `${String(datos.tipo_servicio ?? "")} · ${String(datos.empresa_fumigadora ?? "")}`;
  }
  if (codigo === "R-BPM-03-02" || codigo === "R-BPM-01-02") {
    const items = Array.isArray(datos.items) ? datos.items : [];
    const fallas = items.filter((item) => item === "no_cumple").length;
    return fallas === 0 ? "Sin hallazgos" : `${fallas} ítem${fallas === 1 ? "" : "s"} no cumple`;
  }
  if (codigo === "R-BPM-10-04" || tipo === "capacitacion") {
    const asistentes = Array.isArray(datos.asistentes) ? datos.asistentes.length : datos.asistentes;
    return `${String(datos.tema ?? "")} · ${String(asistentes ?? "—")} asistentes`;
  }
  const responsable = datos.responsable ?? datos.producto ?? datos.empresa ?? "";
  return String(responsable);
}

export function textoAvisoPlanillaPapel(codigo: string, nombre: string) {
  return `Se cargó la planilla impresa ${codigo} (${nombre}) y queda pendiente de revisión.`;
}

export function limiteDeEquipo(equipo: { limite_min?: number | null; limite_max?: number | null }) {
  const { limite_min: min, limite_max: max } = equipo;
  if (min != null && max != null) return `${min} a ${max} °C`;
  if (max != null) return `máximo ${max} °C`;
  if (min != null) return `mínimo ${min} °C`;
  return "";
}
