import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { withTenant } from "@/server/middleware/tenant";
import { requireSuscripcionEscribible } from "@/server/middleware/suscripcion";
import { sonRutasDocumentoDelLocal } from "@/lib/storage/rutas";
import { DECLARACIONES, DECLARACIONES_VERSION } from "@/lib/declaraciones/textos";

const protectedProcedure = publicProcedure.use(withTenant);
const writeProcedure = protectedProcedure.use(requireSuscripcionEscribible);

const MAX_DOCS = 8;

function validarDocumentos(rutas: string[] | undefined, tenantId: string) {
  const unicas = [...new Set(rutas ?? [])];
  if (unicas.length === 0) return [];
  if (unicas.length > MAX_DOCS) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Puedes adjuntar hasta ${MAX_DOCS} archivos.`,
    });
  }
  if (!sonRutasDocumentoDelLocal(unicas, tenantId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Los archivos del proveedor deben subirse desde la plataforma.",
    });
  }
  return unicas;
}

export const proveedoresRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.proveedor.findMany({
      where: { tenant_id: ctx.tenantActivo! },
      orderBy: { razon_social: "asc" },
      include: { _count: { select: { hallazgos: true } } },
    });
  }),

  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const proveedor = await ctx.prisma.proveedor.findUnique({
      where: { id: input.id },
      include: {
        hallazgos: {
          select: { id: true, descripcion: true, estado: true, gravedad: true, created_at: true },
          orderBy: { created_at: "desc" },
        },
      },
    });
    if (!proveedor || proveedor.tenant_id !== ctx.tenantActivo) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Proveedor no encontrado." });
    }
    return proveedor;
  }),

  crear: writeProcedure
    .input(
      z.object({
        razon_social: z.string().min(2).max(200),
        rut: z.string().min(3).max(20),
        contacto: z.string().max(200).optional(),
        tipo_servicio: z.string().min(2).max(120),
        autorizacion_entidad: z.string().max(200).optional(),
        autorizacion_numero: z.string().max(80).optional(),
        vigencia: z.string().datetime().optional(),
        alcance: z.string().max(500).optional(),
        documentos: z.array(z.string().min(1).max(500)).max(MAX_DOCS).optional(),
        acepta_declaracion_b: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const documentos = validarDocumentos(input.documentos, ctx.tenantActivo!);
      if (documentos.length > 0 && input.acepta_declaracion_b !== true) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Debes aceptar la declaración de veracidad para adjuntar archivos.",
        });
      }
      const proveedor = await ctx.prisma.proveedor.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          razon_social: input.razon_social,
          rut: input.rut,
          contacto: input.contacto,
          tipo_servicio: input.tipo_servicio,
          autorizacion_entidad: input.autorizacion_entidad,
          autorizacion_numero: input.autorizacion_numero,
          vigencia: input.vigencia ? new Date(input.vigencia) : null,
          alcance: input.alcance,
          documentos,
        },
      });
      if (documentos.length > 0) {
        await ctx.prisma.declaracionVeracidad.create({
          data: {
            tenant_id: ctx.tenantActivo!,
            user_id: ctx.userId!,
            tipo: "B",
            version: DECLARACIONES_VERSION,
            texto: DECLARACIONES.B.texto,
            evento: "adjuntar_documento_proveedor",
            recurso_tipo: "proveedor",
            recurso_id: proveedor.id,
          },
        });
      }
      return proveedor;
    }),

  adjuntar: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        documentos: z.array(z.string().min(1).max(500)).min(1).max(MAX_DOCS),
        acepta_declaracion_b: z.literal(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const proveedor = await ctx.prisma.proveedor.findUnique({ where: { id: input.id } });
      if (!proveedor || proveedor.tenant_id !== ctx.tenantActivo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proveedor no encontrado." });
      }
      const nuevos = validarDocumentos(input.documentos, ctx.tenantActivo!);
      const documentos = [...new Set([...proveedor.documentos, ...nuevos])];
      if (documentos.length > MAX_DOCS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `El proveedor admite hasta ${MAX_DOCS} archivos.`,
        });
      }
      const actualizado = await ctx.prisma.proveedor.update({
        where: { id: proveedor.id },
        data: { documentos },
      });
      await ctx.prisma.declaracionVeracidad.create({
        data: {
          tenant_id: ctx.tenantActivo!,
          user_id: ctx.userId!,
          tipo: "B",
          version: DECLARACIONES_VERSION,
          texto: DECLARACIONES.B.texto,
          evento: "adjuntar_documento_proveedor",
          recurso_tipo: "proveedor",
          recurso_id: proveedor.id,
        },
      });
      return actualizado;
    }),

  eliminar: writeProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const proveedor = await ctx.prisma.proveedor.findUnique({ where: { id: input.id } });
    if (!proveedor || proveedor.tenant_id !== ctx.tenantActivo) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Proveedor no encontrado." });
    }
    await ctx.prisma.hallazgo.updateMany({
      where: { proveedor_id: input.id },
      data: { proveedor_id: null },
    });
    return ctx.prisma.proveedor.delete({ where: { id: input.id } });
  }),
});
