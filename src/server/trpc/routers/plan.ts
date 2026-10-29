import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAdmin } from "@/server/middleware/rbac";
import { cicloContrato, planIncluye } from "@/lib/planes";
import { planDeLocal } from "@/server/planes/planDeLocal";
import { getCurrentPeriodo } from "@/lib/utils";

const tenantProcedure = publicProcedure.use(withTenant);
const adminProcedure = tenantProcedure.use(requireAdmin);

function rangoDelMes(periodo: string) {
  const [anio, mes] = periodo.split("-").map(Number);
  return { inicio: new Date(anio, mes - 1, 1), fin: new Date(anio, mes, 1) };
}

export const planRouter = router({
  actual: tenantProcedure.query(async ({ ctx }) => {
    const info = await planDeLocal(ctx.prisma, ctx.tenantActivo!);
    return { plan: info.plan, tipoLocal: info.tipoLocal, contratoHasta: info.contratoHasta };
  }),

  resumen: adminProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantActivo!;
    const info = await planDeLocal(ctx.prisma, tenantId);
    const periodo = getCurrentPeriodo();
    const { inicio, fin } = rangoDelMes(periodo);
    const ahora = new Date();
    const ciclo = cicloContrato(info.contratoDesde, ahora);
    const tieneAmbiental = planIncluye(info.plan, "ambiental");

    const [local, visitaMes, proximaVisita, capacitacion, documentos, sello, asignacion, declaraciones, charlasMes] =
      await Promise.all([
        ctx.prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombre: true } }),
        ctx.prisma.visita.findFirst({
          where: { tenant_id: tenantId, estado: "realizada", fecha: { gte: inicio, lt: fin } },
          orderBy: { fecha: "desc" },
          select: { fecha: true },
        }),
        ctx.prisma.visita.findFirst({
          where: { tenant_id: tenantId, estado: "agendada", tipo: "programada", fecha: { gte: ahora } },
          orderBy: { fecha: "asc" },
          select: { fecha: true },
        }),
        ctx.prisma.registro.findFirst({
          where: { tenant_id: tenantId, codigo: "R-BPM-10-04", fecha: { gte: inicio, lt: fin } },
          select: { fecha: true },
        }),
        ctx.prisma.documento.groupBy({
          by: ["estado"],
          where: { tenant_id: tenantId, mes: periodo },
          _count: { _all: true },
        }),
        ctx.prisma.sello.findUnique({
          where: { tenant_id_periodo: { tenant_id: tenantId, periodo } },
          select: { nivel: true, score_general: true, emitido_at: true },
        }),
        ctx.prisma.asignacionAsesor.findFirst({
          where: { tenant_id: tenantId, activo: true },
          select: { asesor_id: true },
        }),
        tieneAmbiental
          ? ctx.prisma.gestionAmbiental.count({
              where: { tenant_id: tenantId, tipo: "ventanilla_unica", fecha: { gte: ciclo.inicio, lt: ciclo.fin } },
            })
          : Promise.resolve(0),
        tieneAmbiental
          ? ctx.prisma.gestionAmbiental.count({
              where: { tenant_id: tenantId, tipo: "charla", fecha: { gte: inicio, lt: fin } },
            })
          : Promise.resolve(0),
      ]);

    const asesor = asignacion
      ? await ctx.prisma.user.findUnique({
          where: { id: asignacion.asesor_id },
          select: { nombre: true, email: true },
        })
      : null;

    const totalDocumentos = documentos.reduce((suma, fila) => suma + fila._count._all, 0);
    const revisados = documentos
      .filter((fila) => fila.estado !== "pendiente")
      .reduce((suma, fila) => suma + fila._count._all, 0);

    return {
      localNombre: local?.nombre ?? "",
      plan: info.plan,
      tipoLocal: info.tipoLocal,
      contrato: {
        desde: info.contratoDesde,
        hasta: info.contratoHasta,
        estado: info.estadoSuscripcion,
        montoMensual: info.montoMensual,
        diaCobro: info.diaCobro,
      },
      servicioDelMes: {
        periodo,
        visita: { fecha: visitaMes?.fecha ?? null, proxima: proximaVisita?.fecha ?? null },
        capacitacion: { fecha: capacitacion?.fecha ?? null },
        documentos: { total: totalDocumentos, revisados },
        sello: sello ? { nivel: sello.nivel, puntaje: sello.score_general, emitidoAt: sello.emitido_at } : null,
      },
      ambiental: tieneAmbiental ? { declaraciones, charlasMes, cicloFin: ciclo.fin } : null,
      asesor: asesor ? { nombre: asesor.nombre, email: asesor.email } : null,
    };
  }),
});
