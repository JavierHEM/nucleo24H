import { estadoContrato } from "@/lib/planes";

export type AlertaLocal = {
  id: string;
  tipo: "vencido" | "proximo";
  mensaje: string;
  href: string;
  fecha?: Date;
};

export type DatosAlertasLocal = {
  ahora: Date;
  documentos: { estado: string; vencimiento: Date | null }[];
  noConformidades: { estado: string; fecha_limite: Date | null }[];
  pago: { suscripcionEstado: string | null; pagadoEnPeriodo: boolean; diaCobro: number } | null;
  contratoHasta: Date | null | undefined;
  vencimientosAmbientales: { vence: Date | null }[] | null;
};

export const DIAS_AVISO_DOCUMENTO = 30;
export const DIAS_AVISO_NC = 14;
export const DIAS_AVISO_AMBIENTAL = 30;

const DIA_MS = 86_400_000;

function plural(cantidad: number, singular: string, pluralTexto: string) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

function proximos<T>(items: T[], fecha: (item: T) => Date | null, ahora: Date, dias: number) {
  const limite = ahora.getTime() + dias * DIA_MS;
  const vencidos: T[] = [];
  const porVencer: T[] = [];
  for (const item of items) {
    const f = fecha(item);
    if (!f) continue;
    if (f < ahora) vencidos.push(item);
    else if (f.getTime() <= limite) porVencer.push(item);
  }
  return { vencidos, porVencer };
}

export function armarAlertasLocal(datos: DatosAlertasLocal): AlertaLocal[] {
  const { ahora } = datos;
  const alertas: AlertaLocal[] = [];

  const docs = proximos(datos.documentos, (d) => d.vencimiento, ahora, DIAS_AVISO_DOCUMENTO);
  if (docs.vencidos.length > 0) {
    alertas.push({
      id: "docs-vencidos",
      tipo: "vencido",
      mensaje: `${plural(docs.vencidos.length, "documento vencido", "documentos vencidos")}`,
      href: "/documentos",
    });
  }
  if (docs.porVencer.length > 0) {
    alertas.push({
      id: "docs-por-vencer",
      tipo: "proximo",
      mensaje: `${plural(docs.porVencer.length, "documento vence", "documentos vencen")} en ${DIAS_AVISO_DOCUMENTO} días o menos`,
      href: "/documentos",
    });
  }
  const observados = datos.documentos.filter((d) => d.estado === "observado").length;
  if (observados > 0) {
    alertas.push({
      id: "docs-observados",
      tipo: "proximo",
      mensaje: plural(observados, "documento con observaciones", "documentos con observaciones"),
      href: "/documentos",
    });
  }

  const ncs = proximos(
    datos.noConformidades.filter((nc) => nc.estado !== "cerrada"),
    (nc) => nc.fecha_limite,
    ahora,
    DIAS_AVISO_NC
  );
  if (ncs.vencidos.length > 0) {
    alertas.push({
      id: "nc-vencidas",
      tipo: "vencido",
      mensaje: plural(ncs.vencidos.length, "plazo de no conformidad vencido", "plazos de no conformidad vencidos"),
      href: "/visitas",
    });
  }
  if (ncs.porVencer.length > 0) {
    alertas.push({
      id: "nc-proximas",
      tipo: "proximo",
      mensaje: `${plural(ncs.porVencer.length, "no conformidad vence", "no conformidades vencen")} en ${DIAS_AVISO_NC} días o menos`,
      href: "/visitas",
    });
  }

  if (datos.pago && !datos.pago.pagadoEnPeriodo) {
    const moroso = datos.pago.suscripcionEstado === "morosa" || ahora.getDate() > datos.pago.diaCobro;
    alertas.push({
      id: "pago-pendiente",
      tipo: moroso ? "vencido" : "proximo",
      mensaje: moroso
        ? "El pago de este mes está pendiente"
        : `El pago de este mes vence el día ${datos.pago.diaCobro}`,
      href: "/suscripcion",
    });
  }

  const contrato = estadoContrato(datos.contratoHasta, ahora);
  if (contrato.estado === "vencido") {
    alertas.push({ id: "contrato-vencido", tipo: "vencido", mensaje: "El contrato anual venció", href: "/plan", fecha: datos.contratoHasta ?? undefined });
  } else if (contrato.estado === "por_vencer") {
    alertas.push({
      id: "contrato-por-vencer",
      tipo: "proximo",
      mensaje: `El contrato anual vence en ${contrato.dias} días`,
      href: "/plan",
      fecha: datos.contratoHasta ?? undefined,
    });
  }

  if (datos.vencimientosAmbientales) {
    const ambientales = proximos(datos.vencimientosAmbientales, (a) => a.vence, ahora, DIAS_AVISO_AMBIENTAL);
    if (ambientales.vencidos.length > 0) {
      alertas.push({
        id: "ambiental-vencidos",
        tipo: "vencido",
        mensaje: plural(ambientales.vencidos.length, "vencimiento ambiental vencido", "vencimientos ambientales vencidos"),
        href: "/ambiental",
      });
    }
    if (ambientales.porVencer.length > 0) {
      alertas.push({
        id: "ambiental-proximos",
        tipo: "proximo",
        mensaje: `${plural(ambientales.porVencer.length, "vencimiento ambiental", "vencimientos ambientales")} en ${DIAS_AVISO_AMBIENTAL} días o menos`,
        href: "/ambiental",
      });
    }
  }

  return alertas.sort((a, b) => Number(b.tipo === "vencido") - Number(a.tipo === "vencido"));
}
