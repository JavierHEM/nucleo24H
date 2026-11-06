import type { PrismaClient } from "@prisma/client";
import { AVISO_RENOVACION_DIAS } from "@/lib/planes";
import { agruparPorPlan } from "@/lib/adminPlanes";
import { ESTADOS_HALLAZGO_ABIERTOS } from "@/lib/hallazgos/ciclo";
import { TICKET_ESTADOS_ABIERTOS } from "@/lib/comunicaciones/tickets";
import { ESTADOS_VISITA_COBERTURA } from "@/lib/bpm/visita";

export async function cargarPanelOperativo(prisma: PrismaClient, ahora = new Date()) {
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const limiteContrato = new Date(ahora.getTime() + AVISO_RENOVACION_DIAS * 86_400_000);

  const [locales, contratos, descargos, visitasMes, asignaciones, hallazgos, peticiones, visitasAgendadas] =
    await Promise.all([
      prisma.tenant.findMany({
        where: { estado: "activo" },
        select: { id: true, nombre: true, plan: true, suscripcion: { select: { plan: true, monto_clp: true } } },
        orderBy: { nombre: "asc" },
      }),
      prisma.suscripcion.findMany({
        where: { hasta: { lte: limiteContrato }, estado: { not: "cancelada" }, tenant: { estado: "activo" } },
        select: { tenant_id: true, hasta: true, tenant: { select: { nombre: true } } },
        orderBy: { hasta: "asc" },
      }),
      prisma.descargo.findMany({
        where: { estado: { in: ["abierto", "en_revision"] } },
        select: { id: true, tenant_id: true, titulo: true, estado: true, created_at: true, tenant: { select: { nombre: true } } },
        orderBy: { created_at: "asc" },
      }),
      prisma.visita.findMany({
        where: { estado: { in: [...ESTADOS_VISITA_COBERTURA] }, fecha: { gte: inicioMes } },
        select: { tenant_id: true, estado: true },
      }),
      prisma.asignacionAsesor.findMany({
        where: { activo: true },
        select: { tenant_id: true },
        distinct: ["tenant_id"],
      }),
      prisma.hallazgo.findMany({
        where: { estado: { in: [...ESTADOS_HALLAZGO_ABIERTOS] }, tenant: { estado: "activo" } },
        select: {
          id: true,
          tenant_id: true,
          descripcion: true,
          gravedad: true,
          estado: true,
          tenant: { select: { nombre: true } },
        },
        orderBy: [{ gravedad: "asc" }, { created_at: "asc" }],
      }),
      prisma.ticket.findMany({
        where: { estado: { in: [...TICKET_ESTADOS_ABIERTOS] } },
        select: {
          id: true,
          tenant_id: true,
          asunto: true,
          estado: true,
          prioridad: true,
          tenant: { select: { nombre: true } },
        },
        orderBy: [{ prioridad: "desc" }, { updated_at: "desc" }],
      }),
      prisma.visita.findMany({
        where: { estado: "agendada" },
        select: {
          id: true,
          tenant_id: true,
          fecha: true,
          motivo: true,
          tipo: true,
          tenant: { select: { nombre: true } },
        },
        orderBy: { fecha: "asc" },
        take: 20,
      }),
    ]);

  const conVisita = new Set(visitasMes.map((visita) => visita.tenant_id));
  const conAsesor = new Set(asignaciones.map((asignacion) => asignacion.tenant_id));
  const visitasRealizadasMes = visitasMes.filter((visita) => visita.estado === "realizada").length;
  const visitasAgendadasMes = visitasMes.filter((visita) => visita.estado === "agendada").length;

  return {
    porPlan: agruparPorPlan(
      locales.map((local) => ({
        plan: local.suscripcion?.plan ?? local.plan,
        monto: local.suscripcion?.monto_clp,
      }))
    ),
    contratosPorVencer: contratos.map((contrato) => ({
      tenantId: contrato.tenant_id,
      nombre: contrato.tenant.nombre,
      hasta: contrato.hasta!,
    })),
    descargosAbiertos: descargos.map((descargo) => ({
      id: descargo.id,
      tenantId: descargo.tenant_id,
      nombre: descargo.tenant.nombre,
      titulo: descargo.titulo,
      estado: descargo.estado,
    })),
    hallazgosAbiertos: hallazgos.map((hallazgo) => ({
      id: hallazgo.id,
      tenantId: hallazgo.tenant_id,
      nombre: hallazgo.tenant.nombre,
      descripcion: hallazgo.descripcion,
      gravedad: hallazgo.gravedad,
      estado: hallazgo.estado,
    })),
    peticionesAbiertas: peticiones.map((ticket) => ({
      id: ticket.id,
      tenantId: ticket.tenant_id,
      nombre: ticket.tenant.nombre,
      asunto: ticket.asunto,
      estado: ticket.estado,
      prioridad: ticket.prioridad,
    })),
    visitasAgendadas: visitasAgendadas.map((visita) => ({
      id: visita.id,
      tenantId: visita.tenant_id,
      nombre: visita.tenant.nombre,
      fecha: visita.fecha,
      motivo: visita.motivo,
      tipo: visita.tipo,
    })),
    visitasMes: {
      realizadas: visitasRealizadasMes,
      agendadas: visitasAgendadasMes,
    },
    sinVisitaEsteMes: locales.filter((local) => !conVisita.has(local.id)).map(({ id, nombre }) => ({ id, nombre })),
    sinAsesor: locales.filter((local) => !conAsesor.has(local.id)).map(({ id, nombre }) => ({ id, nombre })),
  };
}
