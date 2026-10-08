export const GRUPOS_PROTOCOLO = [
  {
    id: "poes",
    titulo: "POES",
    bajada: "Saneamiento. Cómo se limpia y sanitiza el local.",
  },
  {
    id: "poe",
    titulo: "POE",
    bajada: "Operación. Cómo se recibe, guarda, produce y retira.",
  },
  {
    id: "bpm",
    titulo: "BPM",
    bajada: "Buenas prácticas. Higiene del personal y capacitación.",
  },
] as const;

export type GrupoProtocolo = (typeof GRUPOS_PROTOCOLO)[number]["id"];

export type ArchivoOficial = {
  nombre: string;
  codigo?: string;
  path: string;
};

export type ProtocoloOficial = {
  codigo: string;
  nombre: string;
  grupo: GrupoProtocolo;
  procedimiento: ArchivoOficial;
  plantillas: ArchivoOficial[];
};

const BASE = "v1";

export const PROTOCOLOS: ProtocoloOficial[] = [
  {
    codigo: "PR-BPM-02",
    nombre: "Limpieza y sanitización",
    grupo: "poes",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-02.docx` },
    plantillas: [],
  },
  {
    codigo: "PR-BPM-03",
    nombre: "Control de plagas",
    grupo: "poe",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-03.docx` },
    plantillas: [
      {
        codigo: "R-BPM-03-02",
        nombre: "Lista de inspección y monitoreo interno",
        path: `${BASE}/anexos/lista-de-inspeccion-y-monitoreo-interno.docx`,
      },
      {
        codigo: "R-BPM-03-07",
        nombre: "Inducción en prevención de plagas",
        path: `${BASE}/anexos/induccion-control-de-plagas.docx`,
      },
    ],
  },
  {
    codigo: "PR-BPM-04",
    nombre: "Recepción de materias primas e insumos",
    grupo: "poe",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-04.docx` },
    plantillas: [],
  },
  {
    codigo: "PR-BPM-05",
    nombre: "Almacenamiento",
    grupo: "poe",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-05.docx` },
    plantillas: [],
  },
  {
    codigo: "PR-BPM-06",
    nombre: "Manejo y eliminación de residuos",
    grupo: "poe",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-06.docx` },
    plantillas: [
      {
        codigo: "R-BPM-06-02",
        nombre: "Retiro y limpieza de contenedores",
        path: `${BASE}/anexos/registro-de-retiro-y-limpieza-de-contenedores.docx`,
      },
      {
        nombre: "Capacitación en manejo de residuos",
        path: `${BASE}/anexos/registro-de-capacitacion-manejo-de-residuos.docx`,
      },
    ],
  },
  {
    codigo: "PR-BPM-07",
    nombre: "Control de agua potable",
    grupo: "poe",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-07.docx` },
    plantillas: [],
  },
  {
    codigo: "PR-BPM-08",
    nombre: "Producción",
    grupo: "poe",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-08.docx` },
    plantillas: [],
  },
  {
    codigo: "PR-BPM-09",
    nombre: "Trazabilidad y retiro de productos",
    grupo: "poe",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-09.docx` },
    plantillas: [],
  },
  {
    codigo: "PR-BPM-01",
    nombre: "Higiene y salud del personal",
    grupo: "bpm",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-01.docx` },
    plantillas: [
      {
        codigo: "R-BPM-01-02",
        nombre: "Lista de verificación de higiene del personal",
        path: `${BASE}/anexos/lista-de-verificacion-de-higiene-del-personal.docx`,
      },
      {
        nombre: "Declaración y compromiso del trabajador",
        path: `${BASE}/anexos/declaracion-y-compromiso-del-trabajador.docx`,
      },
      {
        nombre: "Inducción en higiene y salud",
        path: `${BASE}/anexos/registro-de-induccion.docx`,
      },
    ],
  },
  {
    codigo: "PR-BPM-10",
    nombre: "Capacitación del personal",
    grupo: "bpm",
    procedimiento: { nombre: "Procedimiento", path: `${BASE}/PR-BPM-10.docx` },
    plantillas: [
      {
        nombre: "Matriz de necesidades de capacitación",
        path: `${BASE}/anexos/matriz-de-capacitaciones.docx`,
      },
    ],
  },
];

export function protocolosDe(grupo: GrupoProtocolo) {
  return PROTOCOLOS.filter((item) => item.grupo === grupo);
}

export function urlOficial(path: string, base = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!base) return "#";
  return `${base}/storage/v1/object/public/bpm-oficial/${path}`;
}
