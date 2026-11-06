import { codigoHallazgo } from "@/lib/hallazgos/codigo";
import { ESTADO_DESCARGO_LABEL, RESULTADO_FISCALIZACION_LABEL } from "@/lib/descargos";
import { ETIQUETA_GRAVEDAD, type GravedadHallazgo } from "@/lib/hallazgos/ciclo";

export const TIPOS_EVENTO = [
  "visita",
  "documento",
  "cobro",
  "contrato",
  "no_conformidad",
  "ambiental",
  "hallazgo",
  "fiscalizacion",
  "descargo",
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  visita: "Visita",
  documento: "Documento",
  cobro: "Cobro",
  contrato: "Contrato",
  no_conformidad: "No conformidad",
  ambiental: "Ambiental",
  hallazgo: "Hallazgo",
  fiscalizacion: "Fiscalización",
  descargo: "Descargo",
};

export type EventoCalendario = {
  id: string;
  tipo: TipoEvento;
  fecha: Date;
  titulo: string;
  detalle?: string;
  href?: string;
  vencido: boolean;
  local?: string;
  tenant_id?: string;
  visita_id?: string;
};

export type FuentesCalendario = {
  visitas: {
    id: string;
    tipo: string;
    estado: string;
    fecha: Date;
    tenant_id?: string;
    local?: string;
    motivo?: string | null;
  }[];
  documentos: ({ id: string; nombre: string; vencimiento: Date | null } & ConLocal)[];
  noConformidades: ({ id: string; descripcion: string; estado: string; fecha_limite: Date | null } & ConLocal)[];
  ambiental: ({ id: string; tipo: string; vence: Date | null } & ConLocal)[];
  suscripcion: { dia_cobro: number; hasta: Date | null } | null;
  hallazgos?: ({
    id: string;
    descripcion: string;
    gravedad: string;
    estado: string;
    plazo: Date | null;
    created_at: Date;
  } & ConLocal)[];
  fiscalizaciones?: ({ id: string; fecha: Date; autoridad: string; resultado: string } & ConLocal)[];
  descargos?: ({ id: string; titulo: string; estado: string; created_at: Date } & ConLocal)[];
};

function recorte(texto: string, maximo = 48) {
  const limpio = texto.trim();
  if (limpio.length <= maximo) return limpio;
  return `${limpio.slice(0, maximo - 1)}…`;
}

function tituloConLocal(local: string | undefined, titulo: string) {
  return local ? `${local} · ${titulo}` : titulo;
}

type ConLocal = { tenant_id?: string; local?: string };

export const TZ_CALENDARIO = "America/Santiago";
export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export type CeldaMes = {
  clave: string;
  dia: number;
  mes: number;
  anio: number;
  fuera: boolean;
};

export function claveDia(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_CALENDARIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

export function partesFecha(fecha: Date): { anio: number; mes: number; dia: number } {
  const [anio, mes, dia] = claveDia(fecha).split("-").map(Number);
  return { anio, mes: mes - 1, dia };
}

export function etiquetaMes(anio: number, mes: number): string {
  const nombre = new Date(Date.UTC(anio, mes, 15)).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export function mesISO(anio: number, mes: number): string {
  return `${anio}-${String(mes + 1).padStart(2, "0")}`;
}

export function parseMes(valor: string | undefined, ahora: Date): { anio: number; mes: number } {
  if (valor && /^\d{4}-\d{2}$/.test(valor)) {
    const [anio, mes] = valor.split("-").map(Number);
    if (mes >= 1 && mes <= 12) return { anio, mes: mes - 1 };
  }
  const actual = partesFecha(ahora);
  return { anio: actual.anio, mes: actual.mes };
}

export function desplazarMes(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const fecha = new Date(Date.UTC(anio, mes + delta, 1));
  return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() };
}

/** Grilla de 6 semanas, lunes a domingo, en fechas civiles (UTC date-only). */
export function celdasDelMes(anio: number, mes: number): CeldaMes[] {
  const weekday = new Date(Date.UTC(anio, mes, 1)).getUTCDay();
  const offset = (weekday + 6) % 7;
  const celdas: CeldaMes[] = [];
  for (let i = 0; i < 42; i += 1) {
    const fecha = new Date(Date.UTC(anio, mes, 1 - offset + i));
    const y = fecha.getUTCFullYear();
    const m = fecha.getUTCMonth();
    const d = fecha.getUTCDate();
    celdas.push({
      clave: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      dia: d,
      mes: m,
      anio: y,
      fuera: m !== mes,
    });
  }
  return celdas;
}

export function agruparPorDia(eventos: EventoCalendario[]): Map<string, EventoCalendario[]> {
  const grupos = new Map<string, EventoCalendario[]>();
  for (const evento of eventos) {
    const clave = claveDia(evento.fecha);
    const lista = grupos.get(clave) ?? [];
    lista.push(evento);
    grupos.set(clave, lista);
  }
  return grupos;
}

export type OpcionesCalendario = {
  ahora: Date;
  verSorpresas: boolean;
  verCobro: boolean;
  dias?: number;
  desde?: Date;
  hasta?: Date;
};

export const DIAS_CALENDARIO = 120;

export function esVisitaVisible(visita: { tipo: string; estado: string }, verSorpresas: boolean): boolean {
  if (visita.estado !== "agendada") return false;
  return visita.tipo !== "sorpresa" || verSorpresas;
}

export function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function proximosCobros(diaCobro: number, ahora: Date, cantidad = 3): Date[] {
  const hoy = inicioDelDia(ahora);
  const fechas: Date[] = [];
  for (let mes = 0; fechas.length < cantidad && mes < cantidad + 2; mes++) {
    const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + mes + 1, 0).getDate();
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + mes, Math.min(diaCobro, ultimoDia));
    if (fecha >= hoy) fechas.push(fecha);
  }
  return fechas;
}

export function armarCalendario(fuentes: FuentesCalendario, opciones: OpcionesCalendario): EventoCalendario[] {
  const hoy = inicioDelDia(opciones.ahora);
  const desde = opciones.desde ?? new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hasta = opciones.hasta ?? new Date(hoy.getTime() + (opciones.dias ?? DIAS_CALENDARIO) * 86_400_000);
  const dentro = (fecha: Date) => fecha >= desde && fecha <= hasta;
  const eventos: EventoCalendario[] = [];

  const agregar = (evento: Omit<EventoCalendario, "vencido">) => {
    if (!dentro(evento.fecha)) return;
    eventos.push({ ...evento, vencido: evento.fecha < hoy });
  };

  for (const visita of fuentes.visitas) {
    if (!esVisitaVisible(visita, opciones.verSorpresas)) continue;
    const tipoVisita = visita.tipo === "sorpresa" ? "Visita sorpresa" : "Visita programada";
    agregar({
      id: `visita-${visita.id}`,
      tipo: "visita",
      fecha: visita.fecha,
      titulo: visita.local ?? tipoVisita,
      detalle: visita.local ? tipoVisita : visita.motivo && visita.motivo !== "rutina" ? visita.motivo : undefined,
      href: "/visitas",
      local: visita.local,
      tenant_id: visita.tenant_id,
      visita_id: visita.id,
    });
  }

  for (const documento of fuentes.documentos) {
    if (!documento.vencimiento) continue;
    agregar({
      id: `documento-${documento.id}`,
      tipo: "documento",
      fecha: documento.vencimiento,
      titulo: tituloConLocal(documento.local, `Vence: ${documento.nombre}`),
      href: "/documentos",
      local: documento.local,
      tenant_id: documento.tenant_id,
    });
  }

  for (const nc of fuentes.noConformidades) {
    if (nc.estado === "cerrada" || !nc.fecha_limite) continue;
    agregar({
      id: `nc-${nc.id}`,
      tipo: "no_conformidad",
      fecha: nc.fecha_limite,
      titulo: tituloConLocal(nc.local, "Plazo de no conformidad"),
      detalle: nc.descripcion,
      href: "/visitas",
      local: nc.local,
      tenant_id: nc.tenant_id,
    });
  }

  for (const registro of fuentes.ambiental) {
    if (!registro.vence) continue;
    agregar({
      id: `ambiental-${registro.id}`,
      tipo: "ambiental",
      fecha: registro.vence,
      titulo: tituloConLocal(registro.local, "Vencimiento ambiental"),
      href: "/ambiental",
      local: registro.local,
      tenant_id: registro.tenant_id,
    });
  }

  for (const hallazgo of fuentes.hallazgos ?? []) {
    const codigo = codigoHallazgo(hallazgo.id);
    const gravedad = ETIQUETA_GRAVEDAD[hallazgo.gravedad as GravedadHallazgo] ?? hallazgo.gravedad;
    agregar({
      id: `hallazgo-alta-${hallazgo.id}`,
      tipo: "hallazgo",
      fecha: hallazgo.created_at,
      titulo: tituloConLocal(hallazgo.local, `Alta ${codigo}`),
      detalle: `${gravedad} · ${recorte(hallazgo.descripcion)}`,
      href: `/hallazgos/${hallazgo.id}`,
      local: hallazgo.local,
      tenant_id: hallazgo.tenant_id,
    });
    if (hallazgo.plazo) {
      agregar({
        id: `hallazgo-plazo-${hallazgo.id}`,
        tipo: "hallazgo",
        fecha: hallazgo.plazo,
        titulo: tituloConLocal(hallazgo.local, `Plazo ${codigo}`),
        detalle: recorte(hallazgo.descripcion),
        href: `/hallazgos/${hallazgo.id}`,
        local: hallazgo.local,
        tenant_id: hallazgo.tenant_id,
      });
    }
  }

  for (const fiscalizacion of fuentes.fiscalizaciones ?? []) {
    agregar({
      id: `fiscalizacion-${fiscalizacion.id}`,
      tipo: "fiscalizacion",
      fecha: fiscalizacion.fecha,
      titulo: tituloConLocal(fiscalizacion.local, fiscalizacion.autoridad),
      detalle:
        RESULTADO_FISCALIZACION_LABEL[fiscalizacion.resultado as keyof typeof RESULTADO_FISCALIZACION_LABEL] ??
        fiscalizacion.resultado,
      href: "/fiscalizaciones",
      local: fiscalizacion.local,
      tenant_id: fiscalizacion.tenant_id,
    });
  }

  for (const descargo of fuentes.descargos ?? []) {
    agregar({
      id: `descargo-${descargo.id}`,
      tipo: "descargo",
      fecha: descargo.created_at,
      titulo: tituloConLocal(descargo.local, recorte(descargo.titulo, 40)),
      detalle: ESTADO_DESCARGO_LABEL[descargo.estado as keyof typeof ESTADO_DESCARGO_LABEL] ?? descargo.estado,
      href: "/fiscalizaciones",
      local: descargo.local,
      tenant_id: descargo.tenant_id,
    });
  }

  if (fuentes.suscripcion) {
    if (opciones.verCobro) {
      proximosCobros(fuentes.suscripcion.dia_cobro, opciones.ahora).forEach((fecha) =>
        agregar({
          id: `cobro-${fecha.toISOString().slice(0, 10)}`,
          tipo: "cobro",
          fecha,
          titulo: "Fecha de cobro mensual",
          href: "/suscripcion",
        })
      );
    }
    if (fuentes.suscripcion.hasta) {
      agregar({
        id: "contrato-fin",
        tipo: "contrato",
        fecha: fuentes.suscripcion.hasta,
        titulo: "Fin del contrato anual",
        href: "/plan",
      });
    }
  }

  return eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}
