export const ESTADOS_LOCAL = ["pendiente", "activo", "suspendido", "baja"] as const;
export type EstadoLocal = (typeof ESTADOS_LOCAL)[number];

/** Núcleo puede seleccionar un local pendiente para cobrar o probar el pago. */
export const ESTADOS_LOCAL_NUCLEO = ["pendiente", "activo", "suspendido"] as const;

export const ETIQUETA_ESTADO_LOCAL: Record<
  EstadoLocal,
  { label: string; className: string }
> = {
  pendiente: { label: "Pendiente de pago", className: "bg-[#E8EEF5] text-[#16294A]" },
  activo: { label: "Activo", className: "bg-[#E5F1E3] text-[#255620]" },
  suspendido: { label: "Suspendido", className: "bg-[#FCF0D0] text-[#7A5000]" },
  baja: { label: "De baja", className: "bg-[#FCE4E1] text-[#9A1C12]" },
};

export function esEstadoLocal(valor: string): valor is EstadoLocal {
  return (ESTADOS_LOCAL as readonly string[]).includes(valor);
}

export function etiquetaEstadoLocal(estado: string) {
  return esEstadoLocal(estado) ? ETIQUETA_ESTADO_LOCAL[estado] : ETIQUETA_ESTADO_LOCAL.activo;
}

/** Solo un local activo se opera. Pendiente espera el primer pago. */
export function localOperable(estado: string) {
  return estado === "activo";
}

export function debeHabilitarTrasPago(estado: string) {
  return estado === "pendiente";
}

export type EstadoEmpresa = "activa" | "pendiente" | "suspendida" | "baja";

export function estadoEmpresa(estados: readonly string[]): EstadoEmpresa {
  if (estados.some((estado) => estado === "activo")) return "activa";
  if (estados.some((estado) => estado === "pendiente")) return "pendiente";
  if (estados.some((estado) => estado === "suspendido")) return "suspendida";
  return "baja";
}

export const ETIQUETA_ESTADO_EMPRESA: Record<
  EstadoEmpresa,
  { label: string; className: string }
> = {
  activa: { label: "Activa", className: "bg-[#E5F1E3] text-[#255620]" },
  pendiente: { label: "Pendiente de pago", className: "bg-[#E8EEF5] text-[#16294A]" },
  suspendida: { label: "Suspendida", className: "bg-[#FCF0D0] text-[#7A5000]" },
  baja: { label: "De baja", className: "bg-[#FCE4E1] text-[#9A1C12]" },
};

/**
 * La Ley 21.719 regula datos personales de personas naturales, no el contrato
 * del local. Suspender o dar de baja un local es una decisión de servicio.
 * Los datos personales no se borran de oficio: el titular usa ARSOPB.
 */
export const NOTA_LEY_21719_LOCAL =
  "Sí puedes deshabilitar un local. La Ley 21.719 cubre datos de personas (equipo, contactos), no el contrato del local. Al suspender, el equipo deja de operar acá y los registros sanitarios se conservan. Al dar de baja termina el servicio; los datos personales no se eliminan solos — el titular los pide en Mi cuenta.";
