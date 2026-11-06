import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAdmin } from "@/server/middleware/rbac";
import { armarCalendario, celdasDelMes, parseMes } from "@/lib/calendario";

const procedure = publicProcedure.use(withTenant).use(requireAdmin);

async function alcanceLocales(ctx: {
  prisma: import("@prisma/client").PrismaClient;
  userId: string;
  userRole: string | null;
  tenantActivo: string;
}): Promise<string[] | "all"> {
  if (ctx.userRole === "admin_nucleo") return "all";
  if (ctx.userRole === "asesor") {
    const asignados = await ctx.prisma.asignacionAsesor.findMany({
      where: { asesor_id: ctx.userId, activo: true },
      select: { tenant_id: true },
    });
    const ids = asignados.map((asignacion) => asignacion.tenant_id);
    return ids.length > 0 ? ids : [ctx.tenantActivo];
  }
  return [ctx.tenantActivo];
}

function whereTenant(alcance: string[] | "all") {
  return alcance === "all" ? {} : { tenant_id: { in: alcance } };
}

export const calendarioRouter = router({
  eventos: procedure
    .input(z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantActivo!;
      const ahora = new Date();
      const esStaff = ctx.userRole === "asesor" || ctx.userRole === "admin_nucleo";
      const { anio, mes } = parseMes(input?.mes, ahora);
      const celdas = celdasDelMes(anio, mes);
      const primera = celdas[0];
      const ultima = celdas[41];
      const desde = new Date(Date.UTC(primera.anio, primera.mes, primera.dia, 0, 0, 0));
      const hasta = new Date(Date.UTC(ultima.anio, ultima.mes, ultima.dia, 23, 59, 59));
      const alcance = esStaff ? await alcanceLocales({ ...ctx, tenantActivo: tenantId }) : [tenantId];
      const delAlcance = whereTenant(alcance);
      const hallazgoAbierto = { notIn: ["cerrado_validado", "seguimiento_eficacia"] };

      const [visitas, documentos, noConformidades, ambiental, suscripcion, hallazgos, fiscalizaciones, descargos] =
        await Promise.all([
          ctx.prisma.visita.findMany({
            where: { estado: "agendada", fecha: { gte: desde, lte: hasta }, ...delAlcance },
            select: {
              id: true,
              tipo: true,
              estado: true,
              fecha: true,
              motivo: true,
              tenant_id: true,
              hallazgo_origen_id: true,
              hallazgo_origen: { select: { id: true, descripcion: true } },
              tenant: { select: { id: true, nombre: true } },
            },
            orderBy: { fecha: "asc" },
          }),
          ctx.prisma.documento.findMany({
            where: { ...delAlcance, vencimiento: { not: null, gte: desde, lte: hasta } },
            select: {
              id: true,
              nombre: true,
              vencimiento: true,
              tenant_id: true,
              tenant: { select: { nombre: true } },
            },
          }),
          ctx.prisma.noConformidad.findMany({
            where: {
              estado: { not: "cerrada" },
              fecha_limite: { not: null, gte: desde, lte: hasta },
              visita: alcance === "all" ? {} : { tenant_id: { in: alcance } },
            },
            select: {
              id: true,
              descripcion: true,
              estado: true,
              fecha_limite: true,
              visita: { select: { tenant_id: true, tenant: { select: { nombre: true } } } },
            },
          }),
          ctx.prisma.gestionAmbiental.findMany({
            where: { ...delAlcance, vence: { not: null, gte: desde, lte: hasta } },
            select: { id: true, tipo: true, vence: true, tenant_id: true, tenant: { select: { nombre: true } } },
          }),
          ctx.prisma.suscripcion.findUnique({
            where: { tenant_id: tenantId },
            select: { dia_cobro: true, hasta: true },
          }),
          ctx.prisma.hallazgo.findMany({
            where: {
              ...delAlcance,
              estado: hallazgoAbierto,
              OR: [{ created_at: { gte: desde, lte: hasta } }, { plazo: { gte: desde, lte: hasta } }],
            },
            select: {
              id: true,
              descripcion: true,
              gravedad: true,
              estado: true,
              plazo: true,
              created_at: true,
              tenant_id: true,
              tenant: { select: { nombre: true } },
            },
          }),
          ctx.prisma.fiscalizacion.findMany({
            where: { ...delAlcance, fecha: { gte: desde, lte: hasta } },
            select: {
              id: true,
              fecha: true,
              autoridad: true,
              resultado: true,
              tenant_id: true,
              tenant: { select: { nombre: true } },
            },
            orderBy: { fecha: "asc" },
          }),
          ctx.prisma.descargo.findMany({
            where: {
              ...delAlcance,
              estado: { not: "cerrado" },
              created_at: { gte: desde, lte: hasta },
            },
            select: {
              id: true,
              titulo: true,
              estado: true,
              created_at: true,
              tenant_id: true,
              tenant: { select: { nombre: true } },
            },
          }),
        ]);

      const eventos = armarCalendario(
        {
          visitas: visitas.map((visita) => ({
            id: visita.id,
            tipo: visita.tipo,
            estado: visita.estado,
            fecha: visita.fecha,
            tenant_id: visita.tenant_id,
            local: visita.tenant.nombre,
            motivo: visita.motivo,
          })),
          documentos: documentos.map((documento) => ({
            ...documento,
            local: documento.tenant.nombre,
          })),
          noConformidades: noConformidades.map((nc) => ({
            id: nc.id,
            descripcion: nc.descripcion,
            estado: nc.estado,
            fecha_limite: nc.fecha_limite,
            tenant_id: nc.visita.tenant_id,
            local: nc.visita.tenant.nombre,
          })),
          ambiental: ambiental.map((registro) => ({
            ...registro,
            local: registro.tenant.nombre,
          })),
          suscripcion,
          hallazgos: hallazgos.map((hallazgo) => ({
            ...hallazgo,
            local: hallazgo.tenant.nombre,
          })),
          fiscalizaciones: fiscalizaciones.map((fiscalizacion) => ({
            ...fiscalizacion,
            local: fiscalizacion.tenant.nombre,
          })),
          descargos: descargos.map((descargo) => ({
            ...descargo,
            local: descargo.tenant.nombre,
          })),
        },
        {
          ahora,
          verSorpresas: esStaff,
          verCobro: ctx.userRole === "admin_local" || ctx.userRole === "admin_nucleo",
          desde,
          hasta,
        }
      );

      return {
        mes: `${anio}-${String(mes + 1).padStart(2, "0")}`,
        eventos,
        visitasAgendadas: esStaff
          ? visitas.map((visita) => ({
              id: visita.id,
              tipo: visita.tipo,
              fecha: visita.fecha,
              motivo: visita.motivo,
              tenant_id: visita.tenant_id,
              local: visita.tenant.nombre,
              hallazgo_origen_id: visita.hallazgo_origen_id,
              hallazgo_origen: visita.hallazgo_origen,
            }))
          : [],
      };
    }),
});
