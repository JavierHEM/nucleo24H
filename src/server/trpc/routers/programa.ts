import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";
import { ajusteSchema, armarAgenda, programaResuelto } from "@/lib/bpm/programa";

const protectedProcedure = publicProcedure.use(withTenant);
const ajustaProcedure = protectedProcedure.use(
  requireRole("jefe_local", "admin_local", "asesor", "admin_nucleo")
);

const equipoSchema = z.object({ nombre: z.string() });

export const programaRouter = router({
  actual: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.prisma.configuracionBpm.findUnique({
      where: { tenant_id: ctx.tenantActivo! },
      select: { programa: true },
    });
    return programaResuelto(config?.programa ?? null);
  }),

  agenda: protectedProcedure.query(async ({ ctx }) => {
    const desde = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const veMes = ctx.userRole !== "trabajador_local";

    const [config, registros, documentos, noConformidades] = await Promise.all([
      ctx.prisma.configuracionBpm.findUnique({
        where: { tenant_id: ctx.tenantActivo! },
        select: { programa: true, equipos_frio: true },
      }),
      ctx.prisma.registro.findMany({
        where: { tenant_id: ctx.tenantActivo!, fecha: { gte: desde } },
        select: { codigo: true, fecha: true, datos: true },
      }),
      veMes
        ? ctx.prisma.documento.findMany({
            where: { tenant_id: ctx.tenantActivo!, vencimiento: { lte: en30dias } },
            select: { id: true, nombre: true, vencimiento: true },
            orderBy: { vencimiento: "asc" },
            take: 5,
          })
        : Promise.resolve([]),
      veMes
        ? ctx.prisma.noConformidad.findMany({
            where: { estado: { not: "cerrada" }, visita: { tenant_id: ctx.tenantActivo! } },
            select: { id: true, descripcion: true, fecha_limite: true, severidad: true },
            orderBy: { fecha_limite: "asc" },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    const equipos = z
      .array(equipoSchema)
      .catch([])
      .parse(config?.equipos_frio ?? [])
      .map((equipo) => equipo.nombre);
    const agenda = armarAgenda({
      programa: programaResuelto(config?.programa ?? null),
      registros,
      equipos,
    });

    return {
      ...agenda,
      mes: veMes
        ? {
            pendientes: agenda.hoy.filter((item) => item.estado === "pendiente").length,
            observaciones: agenda.hoy.filter((item) => item.estado === "observacion").length,
            documentos: documentos.map((documento) => ({
              id: documento.id,
              nombre: documento.nombre,
              vencimiento: documento.vencimiento?.toISOString() ?? null,
            })),
            noConformidades: noConformidades.map((item) => ({
              id: item.id,
              descripcion: item.descripcion,
              severidad: item.severidad,
              fechaLimite: item.fecha_limite?.toISOString() ?? null,
            })),
          }
        : null,
    };
  }),

  guardar: ajustaProcedure
    .input(z.object({ ajustes: z.array(ajusteSchema).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const codigos = new Set(programaResuelto(null).map((item) => item.codigo));
      if (input.ajustes.some((ajuste) => !codigos.has(ajuste.codigo))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Hay una planilla que no reconocemos." });
      }

      await ctx.prisma.configuracionBpm.upsert({
        where: { tenant_id: ctx.tenantActivo! },
        update: { programa: input.ajustes as Prisma.InputJsonValue, updated_at: new Date() },
        create: {
          tenant_id: ctx.tenantActivo!,
          equipos_frio: [],
          areas_limpieza: [],
          programa: input.ajustes as Prisma.InputJsonValue,
        },
      });

      return { ok: true };
    }),
});
