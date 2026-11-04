export const DECLARACIONES_VERSION = "2026-11";

export const DECLARACIONES = {
  A: {
    id: "A" as const,
    titulo: "Al completar un registro",
    texto:
      "Declaro que la información ingresada corresponde a actividades y controles efectivamente realizados en el establecimiento y en las fechas indicadas. Confirmo que los datos son verdaderos y completos según mi conocimiento y que no he inventado, alterado ni registrado resultados ficticios para aparentar cumplimiento. Entiendo que debo corregir cualquier error detectado mediante los mecanismos de rectificación de la plataforma, conservando el historial de cambios.",
  },
  B: {
    id: "B" as const,
    titulo: "Al adjuntar fotografías, certificados o documentos",
    texto:
      "Declaro que los archivos adjuntos son auténticos y corresponden al establecimiento, actividad y período indicados. Confirmo que no han sido manipulados de manera que altere su significado y que cuento con autorización para compartirlos cuando corresponda. Entiendo que su carga no implica que Núcleo 24H haya verificado presencialmente su contenido.",
  },
  C: {
    id: "C" as const,
    titulo: "Al informar una acción correctiva o solicitar cierre",
    texto:
      "Declaro que las medidas correctivas informadas fueron efectivamente ejecutadas en las condiciones y fechas señaladas. Los documentos, fotografías y certificados presentados como respaldo son auténticos y pertinentes. Comprendo que el cierre del hallazgo está sujeto a revisión de Núcleo 24H y puede requerir antecedentes adicionales o verificación en terreno.",
  },
  D: {
    id: "D" as const,
    titulo: "Aceptación general del servicio",
    texto:
      "Reconozco que soy responsable de ejecutar y mantener los controles sanitarios del establecimiento y de entregar información veraz y oportuna. Núcleo 24H presta un servicio de acompañamiento y evaluación dentro del alcance contratado; la revisión documental y la visita mensual no constituyen vigilancia permanente, autorización sanitaria ni garantía absoluta de cumplimiento.",
  },
} as const;

export type TipoDeclaracion = keyof typeof DECLARACIONES;

export const LEYENDA_ALCANCE_SELLO =
  "Este sello refleja una evaluación privada limitada a las evidencias y verificaciones realizadas en el período. No constituye autorización sanitaria ni garantía oficial de cumplimiento.";

export const AVISO_EVIDENCIA_TERCEROS = {
  titulo: "Evidencia de terceros y datos personales",
  texto:
    "Si el archivo fue emitido por un tercero (laboratorio, proveedor, autoridad) o incluye datos de otras personas, confirma que tienes autorización para compartirlo. No subas rostros, RUT ni otros datos personales que no sean necesarios para el control sanitario. Tratamos estos archivos conforme a la Ley 21.719.",
} as const;
