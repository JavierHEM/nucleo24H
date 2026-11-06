import { z } from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAsesor, requireAdmin } from "@/server/middleware/rbac";
import { exigirAsesorAsignado } from "@/server/middleware/asesor";
import {
  itemEvaluacionSchema,
  noConformidadesDe,
  validarEvaluacion,
  MOTIVOS_VISITA,
  TIPOS_VISITA,
  type MotivoVisita,
} from "@/lib/bpm/visita";
import { hallazgoPorCodigo } from "@/lib/hallazgos/codigo";
import type { PrismaClient } from "@prisma/client";

const protectedProcedure = publicProcedure.use(withTenant);
const asesorProcedure = protectedProcedure.use(requireAsesor);
const adminLocalProcedure = protectedProcedure.use(requireAdmin);

const vinculoHallazgoInput = {
  motivo: z.enum(MOTIVOS_VISITA).default("rutina"),
  hallazgo_id: z.string().uuid().optional(),
  hallazgo_codigo: z.string().trim().max(40).optional(),
};

const visitaConHallazgos = {
  no_conformidades: { orderBy: { severidad: "asc" as const } },
  hallazgo_origen: { select: { id: true, descripcion: true, gravedad: true, estado: true } },
  hallazgos_v2: {
    orderBy: { created_at: "desc" as const },
    select: { id: true, descripcion: true, gravedad: true, estado: true, fotos_iniciales: true },
  },
};

async function resolverHallazgoOrigen(
  prisma: PrismaClient,
  tenantId: string,
  input: { motivo: MotivoVisita; hallazgo_id?: string; hallazgo_codigo?: string }
): Promise<string | null> {
  if (input.motivo === "rutina") return null;

  if (input.hallazgo_id) {
    const hallazgo = await prisma.hallazgo.findFirst({
      where: { id: input.hallazgo_id, tenant_id: tenantId },
      select: { id: true },
    });
    if (!hallazgo) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos ese hallazgo en este local." });
    }
    return hallazgo.id;
  }

  const codigo = input.hallazgo_codigo?.trim();
  if (!codigo) {
    if (input.motivo === "hallazgo") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Indica el código del hallazgo que origina esta visita.",
      });
    }
    return null;
  }

  const candidatos = await prisma.hallazgo.findMany({
    where: { tenant_id: tenantId },
    select: { id: true },
  });
  const matches = hallazgoPorCodigo(candidatos, codigo);
  if (matches.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No hay un hallazgo con ese código en este local.",
    });
  }
  if (matches.length > 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Hay más de un hallazgo con ese código. Elige uno de la lista.",
    });
  }
  return matches[0].id;
}

async function vincularHallazgoAVisita(
  prisma: PrismaClient,
  hallazgoId: string | null,
  visitaId: string,
  actorId: string
) {
  if (!hallazgoId) return;
  const hallazgo = await prisma.hallazgo.findUnique({
    where: { id: hallazgoId },
    select: { visita_id: true, estado: true },
  });
  if (!hallazgo || hallazgo.visita_id) return;
  await prisma.hallazgo.update({
    where: { id: hallazgoId },
    data: {
      visita_id: visitaId,
      eventos: {
        create: {
          actor_id: actorId,
          de_estado: hallazgo.estado,
          a_estado: hallazgo.estado,
          nota: "Vinculado a visita de verificación",
        },
      },
    },
  });
}

export const visitasRouter = router({
  list: adminLocalProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.visita.findMany({
        where: { tenant_id: ctx.tenantActivo!, estado: "realizada" },
        orderBy: { fecha: "desc" },
        take: input.limit,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: visitaConHallazgos,
      });
    }),

  getById: adminLocalProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const visita = await ctx.prisma.visita.findUnique({
        where: { id: input.id },
        include: visitaConHallazgos,
      });
      if (!visita || visita.tenant_id !== ctx.tenantActivo || visita.estado !== "realizada") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Visita no encontrada." });
      }
      return visita;
    }),

  registrar: asesorProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        agendada_id: z.string().uuid().optional(),
        tipo: z.enum(TIPOS_VISITA),
        fecha: z.string().datetime(),
        hallazgos: z.string().trim().max(2000).optional(),
        evaluacion: z.array(itemEvaluacionSchema),
        ...vinculoHallazgoInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await exigirAsesorAsignado(ctx, input.tenant_id);

      const error = validarEvaluacion(input.tipo, input.evaluacion);
      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error });
      }

      const noConformidades = noConformidadesDe(input.evaluacion);
      const evaluacion = input.evaluacion.map((item) => ({
        area: item.area,
        resultado: item.resultado,
        ...(item.nota ? { nota: item.nota } : {}),
        ...(item.fecha_limite ? { fecha_limite: item.fecha_limite } : {}),
      }));

      let motivo: MotivoVisita = input.motivo;
      let hallazgoOrigenId = await resolverHallazgoOrigen(ctx.prisma, input.tenant_id, input);

      if (input.agendada_id) {
        const agendada = await ctx.prisma.visita.findUnique({
          where: { id: input.agendada_id },
          select: { tenant_id: true, estado: true, motivo: true, hallazgo_origen_id: true },
        });
        if (!agendada || agendada.tenant_id !== input.tenant_id || agendada.estado !== "agendada") {
          throw new TRPCError({ code: "NOT_FOUND", message: "La visita agendada ya no está disponible." });
        }
        if (!hallazgoOrigenId && agendada.hallazgo_origen_id) {
          hallazgoOrigenId = agendada.hallazgo_origen_id;
        }
        if (motivo === "rutina" && agendada.motivo !== "rutina") {
          motivo = agendada.motivo as MotivoVisita;
        }
      }

      const datos = {
        asesor_id: ctx.userId!,
        tipo: input.tipo,
        estado: "realizada",
        fecha: new Date(input.fecha),
        motivo,
        hallazgo_origen_id: hallazgoOrigenId,
        hallazgos: input.hallazgos || null,
        evaluacion: evaluacion as Prisma.InputJsonValue,
        no_conformidades: {
          create: noConformidades.map((nc) => ({
            area: nc.area,
            descripcion: nc.descripcion,
            severidad: nc.severidad,
            fecha_limite: nc.fecha_limite ? new Date(`${nc.fecha_limite}T12:00:00`) : undefined,
          })),
        },
      };

      const visita = input.agendada_id
        ? await ctx.prisma.visita.update({
            where: { id: input.agendada_id },
            data: datos,
            include: visitaConHallazgos,
          })
        : await ctx.prisma.visita.create({
            data: { tenant_id: input.tenant_id, ...datos },
            include: visitaConHallazgos,
          });

      await vincularHallazgoAVisita(ctx.prisma, hallazgoOrigenId, visita.id, ctx.userId!);

      for (const nc of noConformidades) {
        await ctx.prisma.hallazgo.create({
          data: {
            tenant_id: input.tenant_id,
            visita_id: visita.id,
            gravedad: nc.severidad === "mayor" ? "mayor" : "menor",
            descripcion: nc.descripcion,
            fundamento: nc.area,
            observador_id: ctx.userId!,
            plazo: nc.fecha_limite ? new Date(`${nc.fecha_limite}T12:00:00`) : null,
            eventos: {
              create: { actor_id: ctx.userId!, a_estado: "abierto", nota: "Apertura desde visita" },
            },
          },
        });
      }

      return visita;
    }),

  agendar: asesorProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        tipo: z.enum(TIPOS_VISITA),
        fecha: z.string().datetime(),
        ...vinculoHallazgoInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await exigirAsesorAsignado(ctx, input.tenant_id);

      const fecha = new Date(input.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La fecha de una visita agendada no puede estar en el pasado." });
      }
      const hallazgoOrigenId = await resolverHallazgoOrigen(ctx.prisma, input.tenant_id, input);
      return ctx.prisma.visita.create({
        data: {
          tenant_id: input.tenant_id,
          asesor_id: ctx.userId!,
          tipo: input.tipo,
          estado: "agendada",
          fecha,
          motivo: input.motivo,
          hallazgo_origen_id: hallazgoOrigenId,
        },
      });
    }),

  cancelarAgendada: asesorProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const visita = await ctx.prisma.visita.findUnique({
      where: { id: input.id },
      select: { tenant_id: true, estado: true },
    });
    if (!visita || visita.tenant_id !== ctx.tenantActivo || visita.estado !== "agendada") {
      throw new TRPCError({ code: "NOT_FOUND", message: "La visita agendada ya no está disponible." });
    }
    return ctx.prisma.visita.update({ where: { id: input.id }, data: { estado: "cancelada" } });
  }),

  cerrarNC: adminLocalProcedure
    .input(
      z.object({
        nc_id: z.string().uuid(),
        evidencia: z.string().min(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const nc = await ctx.prisma.noConformidad.findUnique({
        where: { id: input.nc_id },
        include: { visita: true },
      });
      if (!nc || nc.visita.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No conformidad no encontrada.",
        });
      }
      return ctx.prisma.noConformidad.update({
        where: { id: input.nc_id },
        data: {
          estado: "cerrada",
          evidencia_cierre: input.evidencia ?? null,
          cerrada_at: new Date(),
        },
      });
    }),
});
