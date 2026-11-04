import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireRole } from "@/server/middleware/rbac";
import { rutaPertenece } from "@/lib/storage/rutas";
import { DECLARACIONES, DECLARACIONES_VERSION } from "@/lib/declaraciones/textos";
import { requireSuscripcionEscribible } from "@/server/middleware/suscripcion";

const protectedProcedure = publicProcedure.use(withTenant);
const writeProcedure = protectedProcedure.use(requireSuscripcionEscribible);
const asesorProcedure = protectedProcedure.use(
  requireRole("asesor", "admin_nucleo")
);

export const documentosRouter = router({
  list: protectedProcedure
    .input(z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/).optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.documento.findMany({
        where: {
          tenant_id: ctx.tenantActivo!,
          ...(input.mes ? { mes: input.mes } : {}),
        },
        orderBy: { created_at: "desc" },
      });
    }),

  subir: writeProcedure
    .input(
      z.object({
        nombre: z.string().min(1),
        categoria: z.string().min(1),
        mes: z.string().regex(/^\d{4}-\d{2}$/),
        url: z.string().min(1).max(500),
        vencimiento: z.string().datetime().optional(),
        acepta_declaracion_b: z.literal(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!rutaPertenece(input.url, "documentos", ctx.tenantActivo!)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El archivo no corresponde a este local.",
        });
      }
      const doc = await ctx.prisma.documento.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          nombre: input.nombre,
          categoria: input.categoria,
          mes: input.mes,
          url: input.url,
          evidencia_estado: "declarado_cliente",
          vencimiento: input.vencimiento
            ? new Date(input.vencimiento)
            : undefined,
          created_by: ctx.userId!,
        },
      });
      await ctx.prisma.declaracionVeracidad.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          user_id: ctx.userId!,
          tipo: "B",
          version: DECLARACIONES_VERSION,
          texto: DECLARACIONES.B.texto,
          evento: "adjuntar_documento",
          recurso_tipo: "documento",
          recurso_id: doc.id,
        },
      });
      return doc;
    }),

  revisar: asesorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        estado: z.enum(["aprobado", "observado", "rechazado"]),
        observacion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.documento.findUnique({
        where: { id: input.id },
      });
      if (!doc || doc.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento no encontrado.",
        });
      }
      return ctx.prisma.documento.update({
        where: { id: input.id },
        data: {
          estado: input.estado,
          observacion: input.observacion,
          evidencia_estado: input.estado === "aprobado" ? "revisado_documental" : doc.evidencia_estado,
        },
      });
    }),

  marcarEvidencia: asesorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        evidencia_estado: z.enum(["declarado_cliente", "revisado_documental", "verificado_visita"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.documento.findUnique({ where: { id: input.id } });
      if (!doc || doc.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado." });
      }
      return ctx.prisma.documento.update({
        where: { id: input.id },
        data: { evidencia_estado: input.evidencia_estado },
      });
    }),
});
