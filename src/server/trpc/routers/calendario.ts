import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAdmin } from "@/server/middleware/rbac";
import { planIncluye } from "@/lib/planes";
import { planDeLocal } from "@/server/planes/planDeLocal";
import { armarCalendario } from "@/lib/calendario";

const procedure = publicProcedure.use(withTenant).use(requireAdmin);

export const calendarioRouter = router({
  eventos: procedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantActivo!;
    const ahora = new Date();
    const esStaff = ctx.userRole === "asesor" || ctx.userRole === "admin_nucleo";
    const info = await planDeLocal(ctx.prisma, tenantId);
    const conAmbiental = planIncluye(info.plan, "ambiental");

    const [visitas, documentos, noConformidades, ambiental, suscripcion] = await Promise.all([
      ctx.prisma.visita.findMany({
        where: { tenant_id: tenantId, estado: "agendada", fecha: { gte: new Date(ahora.getFullYear(), ahora.getMonth(), 1) } },
        select: { id: true, tipo: true, estado: true, fecha: true },
      }),
      ctx.prisma.documento.findMany({
        where: { tenant_id: tenantId, vencimiento: { not: null } },
        select: { id: true, nombre: true, vencimiento: true },
      }),
      ctx.prisma.noConformidad.findMany({
        where: { visita: { tenant_id: tenantId }, estado: { not: "cerrada" }, fecha_limite: { not: null } },
        select: { id: true, descripcion: true, estado: true, fecha_limite: true },
      }),
      conAmbiental
        ? ctx.prisma.gestionAmbiental.findMany({
            where: { tenant_id: tenantId, vence: { not: null } },
            select: { id: true, tipo: true, vence: true },
          })
        : Promise.resolve([]),
      ctx.prisma.suscripcion.findUnique({
        where: { tenant_id: tenantId },
        select: { dia_cobro: true, hasta: true },
      }),
    ]);

    const eventos = armarCalendario(
      { visitas, documentos, noConformidades, ambiental, suscripcion },
      {
        ahora,
        verSorpresas: esStaff,
        verCobro: ctx.userRole === "admin_local" || ctx.userRole === "admin_nucleo",
      }
    );

    return {
      eventos,
      visitasAgendadas: esStaff
        ? visitas.map((visita) => ({ id: visita.id, tipo: visita.tipo, fecha: visita.fecha }))
        : [],
    };
  }),
});
