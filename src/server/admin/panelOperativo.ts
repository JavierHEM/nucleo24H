import type { PrismaClient } from "@prisma/client";
import { AVISO_RENOVACION_DIAS } from "@/lib/planes";
import { agruparPorPlan } from "@/lib/adminPlanes";

export async function cargarPanelOperativo(prisma: PrismaClient, ahora = new Date()) {
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const limiteContrato = new Date(ahora.getTime() + AVISO_RENOVACION_DIAS * 86_400_000);

  const [locales, contratos, descargos, visitasMes, asignaciones] = await Promise.all([
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
      where: { estado: "realizada", fecha: { gte: inicioMes } },
      select: { tenant_id: true },
      distinct: ["tenant_id"],
    }),
    prisma.asignacionAsesor.findMany({
      where: { activo: true },
      select: { tenant_id: true },
      distinct: ["tenant_id"],
    }),
  ]);

  const conVisita = new Set(visitasMes.map((visita) => visita.tenant_id));
  const conAsesor = new Set(asignaciones.map((asignacion) => asignacion.tenant_id));

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
    sinVisitaEsteMes: locales.filter((local) => !conVisita.has(local.id)).map(({ id, nombre }) => ({ id, nombre })),
    sinAsesor: locales.filter((local) => !conAsesor.has(local.id)).map(({ id, nombre }) => ({ id, nombre })),
  };
}
