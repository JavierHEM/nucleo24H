import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";
import { requireSuscripcionEscribible } from "@/server/middleware/suscripcion";

const protectedProcedure = publicProcedure.use(withTenant);
const writeProcedure = protectedProcedure.use(requireSuscripcionEscribible);
const nucleoProcedure = publicProcedure.use(requireRole("admin_nucleo"));

const preguntaSchema = z.object({
  enunciado: z.string(),
  alternativas: z.array(z.string()).min(2),
  correcta: z.number().int().min(0),
});

export const capacitacionesLmsRouter = router({
  contenidos: protectedProcedure.query(async ({ ctx }) => {
    let contenidos = await ctx.prisma.capacitacionContenido.findMany({
      where: { activo: true },
      orderBy: { created_at: "desc" },
    });
    if (contenidos.length === 0) {
      const creado = await ctx.prisma.capacitacionContenido.create({
        data: {
          titulo: "Higiene de manos y manipulación",
          descripcion: "Capacitación interna Núcleo 24H. La constancia no es una certificación oficial.",
          url_recurso: "https://nucleo24h.cl/inicio",
          tipo_recurso: "video",
          preguntas: [
            {
              enunciado: "¿Cuánto debe durar el lavado de manos?",
              alternativas: ["5 segundos", "Al menos 20 segundos", "Un minuto exacto"],
              correcta: 1,
            },
          ],
        },
      });
      contenidos = [creado];
    }
    return contenidos;
  }),

  historial: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.capacitacionRegistro.findMany({
      where: { tenant_id: ctx.tenantActivo! },
      include: { contenido: { select: { titulo: true } } },
      orderBy: { created_at: "desc" },
      take: 50,
    });
  }),

  evaluar: writeProcedure
    .input(z.object({ contenido_id: z.string().uuid(), respuestas: z.array(z.number().int()) }))
    .mutation(async ({ ctx, input }) => {
      const contenido = await ctx.prisma.capacitacionContenido.findUnique({ where: { id: input.contenido_id } });
      if (!contenido) throw new TRPCError({ code: "NOT_FOUND", message: "Capacitación no encontrada." });
      const preguntas = z.array(preguntaSchema).parse(contenido.preguntas);
      let correctas = 0;
      preguntas.forEach((pregunta, i) => {
        if (input.respuestas[i] === pregunta.correcta) correctas += 1;
      });
      const puntaje = preguntas.length === 0 ? 100 : Math.round((correctas / preguntas.length) * 100);
      return ctx.prisma.capacitacionRegistro.create({
        data: {
          contenido_id: contenido.id,
          tenant_id: ctx.tenantActivo!,
          user_id: ctx.userId!,
          puntaje,
          aprobado: puntaje >= 70,
        },
      });
    }),

  publicar: nucleoProcedure
    .input(
      z.object({
        titulo: z.string().min(3),
        descripcion: z.string().min(8),
        url_recurso: z.string().url(),
        tipo_recurso: z.enum(["video", "presentacion"]).default("video"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.capacitacionContenido.create({ data: input });
    }),
});
