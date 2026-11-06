import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireAuth, requireRole } from "@/server/middleware/rbac";
import {
  ETIQUETA_ESTADO,
  TICKET_CATEGORIAS,
  TICKET_PRIORIDADES,
  destinatariosNuevaPeticion,
  destinatariosRespuesta,
  esLocalComunicaciones,
  esStaffNucleo,
  estadoTrasRespuesta,
  transicionTicket,
  type AccionTicket,
} from "@/lib/comunicaciones/tickets";
import { crearNotificaciones, idsAdminNucleo } from "@/server/comunicaciones/notificar";
import { cupoProfesional, esConsultaProfesional, periodoDe } from "@/lib/comunicaciones/cupos";
import { requireSuscripcionEscribible } from "@/server/middleware/suscripcion";
import { MAX_ADJUNTOS_MENSAJE, MAX_ADJUNTOS_PETICION } from "@/lib/comunicaciones/adjuntos";
import { sonRutasDocumentoDelLocal } from "@/lib/storage/rutas";
import { DECLARACIONES, DECLARACIONES_VERSION } from "@/lib/declaraciones/textos";

const commsProcedure = publicProcedure.use(
  requireRole("jefe_local", "admin_local", "asesor", "admin_nucleo")
);
const localProcedure = publicProcedure
  .use(withTenant)
  .use(requireRole("jefe_local", "admin_local"));
const localWriteProcedure = localProcedure.use(requireSuscripcionEscribible);
const authProcedure = publicProcedure.use(requireAuth);

const ticketInclude = {
  tenant: { select: { id: true, nombre: true } },
  autor: { select: { id: true, nombre: true, email: true, rol: true } },
  asignado: { select: { id: true, nombre: true, email: true, rol: true } },
} as const;

async function tenantIdsVisibles(ctx: {
  prisma: typeof import("@/server/db/prisma").prisma;
  userId: string;
  userRole: string | null;
  tenants: string[];
  tenantActivo: string | null;
}): Promise<string[] | "all"> {
  if (ctx.userRole === "admin_nucleo") return "all";
  if (ctx.userRole === "asesor") {
    const asignados = await ctx.prisma.asignacionAsesor.findMany({
      where: { asesor_id: ctx.userId, activo: true },
      select: { tenant_id: true },
    });
    return asignados.map((asignacion) => asignacion.tenant_id);
  }
  if (ctx.tenantActivo) return [ctx.tenantActivo];
  return ctx.tenants;
}

async function exigirTicket(ctx: {
  prisma: typeof import("@/server/db/prisma").prisma;
  userId: string;
  userRole: string | null;
  tenants: string[];
  tenantActivo: string | null;
}, ticketId: string) {
  const ticket = await ctx.prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      ...ticketInclude,
      mensajes: {
        orderBy: { created_at: "asc" },
        include: {
          remitente: { select: { id: true, nombre: true, email: true, rol: true } },
        },
      },
    },
  });
  if (!ticket) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos esa petición." });
  }
  const visibles = await tenantIdsVisibles(ctx);
  if (visibles !== "all" && !visibles.includes(ticket.tenant_id)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta petición." });
  }
  return ticket;
}

export const comunicacionesRouter = router({
  listTickets: commsProcedure
    .input(
      z.object({
        estado: z.enum(["pendientes", "abierta", "en_atencion", "resuelta", "todas"]).default("pendientes"),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const visibles = await tenantIdsVisibles(ctx);
      if (visibles !== "all" && visibles.length === 0) return [];

      const estadoFiltro =
        input.estado === "todas"
          ? undefined
          : input.estado === "pendientes"
            ? { in: ["abierta", "en_atencion"] }
            : input.estado;

      return ctx.prisma.ticket.findMany({
        where: {
          ...(visibles === "all" ? {} : { tenant_id: { in: visibles } }),
          ...(estadoFiltro ? { estado: estadoFiltro } : {}),
        },
        include: {
          ...ticketInclude,
          mensajes: {
            orderBy: { created_at: "desc" },
            take: 1,
            select: { contenido: true, created_at: true, de: true },
          },
          _count: { select: { mensajes: true } },
        },
        orderBy: [{ prioridad: "desc" }, { updated_at: "desc" }],
        take: input.limit,
      });
    }),

  resumen: commsProcedure.query(async ({ ctx }) => {
    const visibles = await tenantIdsVisibles(ctx);
    if (visibles !== "all" && visibles.length === 0) {
      return { abiertas: 0, enAtencion: 0, resueltas: 0 };
    }
    const where = visibles === "all" ? {} : { tenant_id: { in: visibles } };
    const [abiertas, enAtencion, resueltas] = await Promise.all([
      ctx.prisma.ticket.count({ where: { ...where, estado: "abierta" } }),
      ctx.prisma.ticket.count({ where: { ...where, estado: "en_atencion" } }),
      ctx.prisma.ticket.count({ where: { ...where, estado: "resuelta" } }),
    ]);
    return { abiertas, enAtencion, resueltas };
  }),

  getTicket: commsProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => exigirTicket(ctx, input.id)),

  cupo: localProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantActivo!;
    const tenant = await ctx.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { created_at: true },
    });
    const periodo = periodoDe(new Date());
    const usadas = await ctx.prisma.ticket.count({
      where: {
        tenant_id: tenantId,
        categoria: { in: ["consulta", "documentos", "visita"] },
        created_at: {
          gte: new Date(`${periodo}-01T00:00:00`),
        },
      },
    });
    return cupoProfesional({ tenantCreadoAt: tenant?.created_at ?? new Date(), usadasEnPeriodo: usadas });
  }),

  crearTicket: localWriteProcedure
    .input(
      z.object({
        asunto: z.string().trim().min(3, "Escribe un asunto de al menos 3 caracteres.").max(120),
        categoria: z.enum(TICKET_CATEGORIAS),
        prioridad: z.enum(TICKET_PRIORIDADES).default("normal"),
        mensaje: z.string().trim().min(1, "Escribe el detalle de tu petición.").max(2000),
        adjuntos: z.array(z.string().min(1).max(500)).max(MAX_ADJUNTOS_PETICION).default([]),
        acepta_declaracion_b: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantActivo!;
      if (esConsultaProfesional(input.categoria)) {
        const tenant = await ctx.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { created_at: true },
        });
        const periodo = periodoDe(new Date());
        const usadas = await ctx.prisma.ticket.count({
          where: {
            tenant_id: tenantId,
            categoria: { in: ["consulta", "documentos", "visita"] },
            created_at: { gte: new Date(`${periodo}-01T00:00:00`) },
          },
        });
        const cupo = cupoProfesional({
          tenantCreadoAt: tenant?.created_at ?? new Date(),
          usadasEnPeriodo: usadas,
        });
        if (!cupo.ilimitado && cupo.restantes <= 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Ya usaste las 5 consultas profesionales de este mes. El soporte técnico de la plataforma sigue disponible.",
          });
        }
      }
      const asignacion = await ctx.prisma.asignacionAsesor.findFirst({
        where: { tenant_id: tenantId, activo: true },
        select: { asesor_id: true },
      });
      const admins = await idsAdminNucleo(ctx.prisma);
      const destinatarioMensaje = asignacion?.asesor_id ?? admins[0];
      if (!destinatarioMensaje) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Aún no hay un asesor ni un administrador de Núcleo para atenderte.",
        });
      }

      if (input.adjuntos.length > 0) {
        if (!sonRutasDocumentoDelLocal(input.adjuntos, tenantId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Los archivos deben subirse desde la plataforma para este local.",
          });
        }
        if (input.acepta_declaracion_b !== true) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Debes aceptar la declaración de veracidad para adjuntar evidencia.",
          });
        }
      }

      const ticket = await ctx.prisma.ticket.create({
        data: {
          tenant_id: tenantId,
          creado_por: ctx.userId!,
          asignado_a: asignacion?.asesor_id ?? null,
          asunto: input.asunto,
          categoria: input.categoria,
          prioridad: input.prioridad,
          adjuntos: input.adjuntos,
          mensajes: {
            create: {
              tenant_id: tenantId,
              de: ctx.userId!,
              para: destinatarioMensaje,
              contenido: input.mensaje,
              adjuntos: input.adjuntos,
            },
          },
        },
      });

      if (input.adjuntos.length > 0) {
        await ctx.prisma.declaracionVeracidad.create({
          data: {
            tenant_id: tenantId,
            user_id: ctx.userId!,
            tipo: "B",
            version: DECLARACIONES_VERSION,
            texto: DECLARACIONES.B.texto,
            evento: "adjuntar_evidencia_peticion",
            recurso_tipo: "ticket",
            recurso_id: ticket.id,
          },
        });
      }

      const localNombre =
        (await ctx.prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombre: true } }))
          ?.nombre ?? "un local";
      await crearNotificaciones(ctx.prisma, {
        userIds: destinatariosNuevaPeticion({
          autorId: ctx.userId!,
          asesorId: asignacion?.asesor_id ?? null,
          adminNucleoIds: admins,
        }),
        tenantId,
        ticketId: ticket.id,
        tipo: "ticket_nueva",
        titulo: `Nueva petición · ${localNombre}`,
        cuerpo: input.asunto,
      });

      return ticket;
    }),

  responder: commsProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        contenido: z.string().trim().max(2000).default(""),
        adjuntos: z.array(z.string().min(1).max(500)).max(MAX_ADJUNTOS_MENSAJE).default([]),
        acepta_declaracion_b: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contenido = input.contenido.trim();
      if (contenido.length === 0 && input.adjuntos.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Escribe una respuesta o adjunta un archivo." });
      }
      const ticket = await exigirTicket(ctx, input.ticketId);
      const respondeStaff = esStaffNucleo(ctx.userRole);
      if (!respondeStaff && !esLocalComunicaciones(ctx.userRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes responder esta petición." });
      }
      if (input.adjuntos.length > 0 && !sonRutasDocumentoDelLocal(input.adjuntos, ticket.tenant_id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Los archivos deben subirse desde la plataforma para este local.",
        });
      }
      if (input.adjuntos.length > 0 && !respondeStaff && input.acepta_declaracion_b !== true) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Debes aceptar la declaración de veracidad para adjuntar evidencia.",
        });
      }

      const para = respondeStaff
        ? ticket.creado_por
        : ticket.asignado_a ?? (await idsAdminNucleo(ctx.prisma))[0];
      if (!para) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No hay destinatario disponible para esta respuesta.",
        });
      }

      const nuevoEstado = estadoTrasRespuesta({
        estadoActual: ticket.estado,
        respondeStaff,
      });

      const mensaje = await ctx.prisma.mensaje.create({
        data: {
          tenant_id: ticket.tenant_id,
          ticket_id: ticket.id,
          de: ctx.userId!,
          para,
          contenido: contenido || "Evidencia adjunta.",
          adjuntos: input.adjuntos,
        },
      });

      const adjuntosCaso =
        input.adjuntos.length > 0
          ? [...new Set([...ticket.adjuntos, ...input.adjuntos])].slice(0, MAX_ADJUNTOS_PETICION)
          : ticket.adjuntos;

      await ctx.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          updated_at: new Date(),
          adjuntos: adjuntosCaso,
          ...(nuevoEstado
            ? {
                estado: nuevoEstado,
                resuelto_at: nuevoEstado === "resuelta" ? new Date() : null,
              }
            : {}),
          ...(respondeStaff && !ticket.asignado_a ? { asignado_a: ctx.userId! } : {}),
        },
      });

      if (input.adjuntos.length > 0 && !respondeStaff) {
        await ctx.prisma.declaracionVeracidad.create({
          data: {
            tenant_id: ticket.tenant_id,
            user_id: ctx.userId!,
            tipo: "B",
            version: DECLARACIONES_VERSION,
            texto: DECLARACIONES.B.texto,
            evento: "adjuntar_evidencia_peticion",
            recurso_tipo: "ticket",
            recurso_id: ticket.id,
          },
        });
      }

      const admins = await idsAdminNucleo(ctx.prisma);
      await crearNotificaciones(ctx.prisma, {
        userIds: destinatariosRespuesta({
          autorId: ticket.creado_por,
          asignadoId: ticket.asignado_a,
          adminNucleoIds: admins,
          remitenteId: ctx.userId!,
          respondeStaff,
        }),
        tenantId: ticket.tenant_id,
        ticketId: ticket.id,
        tipo: "ticket_respuesta",
        titulo: respondeStaff ? "Núcleo respondió tu petición" : `Nueva respuesta · ${ticket.tenant.nombre}`,
        cuerpo: ticket.asunto,
      });

      return mensaje;
    }),

  cambiarEstado: commsProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        accion: z.enum(["atender", "resolver", "reabrir"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!esStaffNucleo(ctx.userRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo Núcleo puede cambiar el estado." });
      }
      const ticket = await exigirTicket(ctx, input.ticketId);
      const siguiente = transicionTicket(ticket.estado, input.accion as AccionTicket);
      if (!siguiente) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ese cambio de estado no aplica a esta petición.",
        });
      }

      const actualizado = await ctx.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          estado: siguiente,
          resuelto_at: siguiente === "resuelta" ? new Date() : null,
          asignado_a: ticket.asignado_a ?? ctx.userId!,
        },
      });

      await crearNotificaciones(ctx.prisma, {
        userIds: [ticket.creado_por].filter((id) => id !== ctx.userId),
        tenantId: ticket.tenant_id,
        ticketId: ticket.id,
        tipo: "ticket_estado",
        titulo: `Petición ${ETIQUETA_ESTADO[siguiente].toLowerCase()}`,
        cuerpo: ticket.asunto,
      });

      return actualizado;
    }),

  notificaciones: authProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.notificacion.findMany({
        where: { user_id: ctx.userId! },
        orderBy: { created_at: "desc" },
        take: input?.limit ?? 20,
        include: { tenant: { select: { nombre: true } } },
      });
    }),

  contadorNoLeidos: authProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notificacion.count({
      where: { user_id: ctx.userId!, leida: false },
    });
  }),

  marcarNotificacionLeida: authProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notificacion.updateMany({
        where: { id: input.id, user_id: ctx.userId! },
        data: { leida: true },
      });
      return { ok: true };
    }),

  marcarTodasLeidas: authProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notificacion.updateMany({
      where: { user_id: ctx.userId!, leida: false },
      data: { leida: true },
    });
    return { ok: true };
  }),
});
