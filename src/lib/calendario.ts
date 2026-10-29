export const TIPOS_EVENTO = ["visita", "documento", "cobro", "contrato", "no_conformidad", "ambiental"] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  visita: "Visita",
  documento: "Documento",
  cobro: "Cobro",
  contrato: "Contrato",
  no_conformidad: "No conformidad",
  ambiental: "Ambiental",
};

export type EventoCalendario = {
  id: string;
  tipo: TipoEvento;
  fecha: Date;
  titulo: string;
  detalle?: string;
  href?: string;
  vencido: boolean;
};

export type FuentesCalendario = {
  visitas: { id: string; tipo: string; estado: string; fecha: Date }[];
  documentos: { id: string; nombre: string; vencimiento: Date | null }[];
  noConformidades: { id: string; descripcion: string; estado: string; fecha_limite: Date | null }[];
  ambiental: { id: string; tipo: string; vence: Date | null }[];
  suscripcion: { dia_cobro: number; hasta: Date | null } | null;
};

export type OpcionesCalendario = {
  ahora: Date;
  verSorpresas: boolean;
  verCobro: boolean;
  dias?: number;
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
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hasta = new Date(hoy.getTime() + (opciones.dias ?? DIAS_CALENDARIO) * 86_400_000);
  const dentro = (fecha: Date) => fecha >= desde && fecha <= hasta;
  const eventos: EventoCalendario[] = [];

  const agregar = (evento: Omit<EventoCalendario, "vencido">) => {
    if (!dentro(evento.fecha)) return;
    eventos.push({ ...evento, vencido: evento.fecha < hoy });
  };

  for (const visita of fuentes.visitas) {
    if (!esVisitaVisible(visita, opciones.verSorpresas)) continue;
    agregar({
      id: `visita-${visita.id}`,
      tipo: "visita",
      fecha: visita.fecha,
      titulo: visita.tipo === "sorpresa" ? "Visita sorpresa" : "Visita programada",
      href: "/visitas",
    });
  }

  for (const documento of fuentes.documentos) {
    if (!documento.vencimiento) continue;
    agregar({
      id: `documento-${documento.id}`,
      tipo: "documento",
      fecha: documento.vencimiento,
      titulo: `Vence: ${documento.nombre}`,
      href: "/documentos",
    });
  }

  for (const nc of fuentes.noConformidades) {
    if (nc.estado === "cerrada" || !nc.fecha_limite) continue;
    agregar({
      id: `nc-${nc.id}`,
      tipo: "no_conformidad",
      fecha: nc.fecha_limite,
      titulo: "Plazo de no conformidad",
      detalle: nc.descripcion,
      href: "/visitas",
    });
  }

  for (const registro of fuentes.ambiental) {
    if (!registro.vence) continue;
    agregar({
      id: `ambiental-${registro.id}`,
      tipo: "ambiental",
      fecha: registro.vence,
      titulo: "Vencimiento ambiental",
      href: "/ambiental",
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
