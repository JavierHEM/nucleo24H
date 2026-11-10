import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { requireNucleo } from "@/server/middleware/rbac";
import { claveRut } from "@/lib/empresas";
import { altaSuscripcionLocal } from "@/lib/locales/altaSuscripcion";
import { construirAltaEmpresa } from "@/lib/locales/altaEmpresa";
import { actualizarEmpresaSchema, altaEmpresaSchema, emailOpcional, textoOpcional } from "@/lib/locales/ficha";
import { invitarAdminLocal } from "@/server/locales/invitarAdminLocal";

const nucleoProcedure = publicProcedure.use(requireNucleo);

const INCLUDE_LOCAL = {
  _count: { select: { registros: true, sellos: true } },
  suscripcion: { select: { plan: true, hasta: true, estado: true, monto_clp: true } },
} as const;

export const empresasRouter = router({
  porRut: nucleoProcedure
    .input(z.object({ rut: z.string().min(3).max(40) }))
    .query(async ({ ctx, input }) => {
      const clave = claveRut(input.rut);
      const empresa =
        (await ctx.prisma.empresa.findUnique({ where: { rut: clave } })) ??
        (await ctx.prisma.empresa.findFirst({
          where: { rut: { equals: clave, mode: "insensitive" } },
        }));
      if (!empresa) return null;
      const locales = await ctx.prisma.tenant.findMany({
        where: { empresa_id: empresa.id },
        include: INCLUDE_LOCAL,
        orderBy: { created_at: "asc" },
      });
      return { empresa, locales };
    }),

  crear: nucleoProcedure.input(altaEmpresaSchema).mutation(async ({ ctx, input }) => {
    const alta = construirAltaEmpresa(input);
    const duplicada = await ctx.prisma.empresa.findUnique({
      where: { rut: alta.empresa.rut },
      select: { id: true, razon_social: true },
    });
    if (duplicada) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `El RUT ${alta.empresa.rut} ya pertenece a "${duplicada.razon_social}". Entra a esa empresa y usa Nueva sucursal.`,
      });
    }

    const creado = await ctx.prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({ data: alta.empresa });
      const local = await tx.tenant.create({
        data: {
          ...alta.tenant,
          empresa_id: empresa.id,
        },
      });
      await tx.suscripcion.create({
        data: {
          tenant_id: local.id,
          ...altaSuscripcionLocal({ plan: alta.plan }),
        },
      });
      return { empresa, local };
    });

    let invitacion: { message: string } | null = null;
    if (alta.emailAdmin) {
      try {
        invitacion = await invitarAdminLocal({
          tenantId: creado.local.id,
          tenantNombre: creado.local.nombre,
          email: alta.emailAdmin,
          invitadorId: ctx.userId,
        });
      } catch (error) {
        invitacion = {
          message:
            error instanceof Error
              ? `Empresa creada. No se pudo invitar: ${error.message}`
              : "Empresa creada. No se pudo enviar la invitación.",
        };
      }
    }

    return {
      empresa: creado.empresa,
      local: creado.local,
      invitacion,
    };
  }),

  actualizar: nucleoProcedure.input(actualizarEmpresaSchema).mutation(async ({ ctx, input }) => {
    const { id, ...ficha } = input;
    const actual = await ctx.prisma.empresa.findUnique({
      where: { id },
      select: { id: true, rut: true },
    });
    if (!actual) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Empresa no encontrada." });
    }

    const rut = claveRut(ficha.rut);
    if (rut !== claveRut(actual.rut)) {
      const conflicto = await ctx.prisma.empresa.findFirst({
        where: { rut, NOT: { id } },
        select: { razon_social: true },
      });
      if (conflicto) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `El RUT ${rut} ya pertenece a "${conflicto.razon_social}".`,
        });
      }
    }

    const empresa = await ctx.prisma.$transaction(async (tx) => {
      const actualizada = await tx.empresa.update({
        where: { id },
        data: {
          razon_social: ficha.razon_social,
          rut,
          giro: textoOpcional(ficha.giro) ?? null,
          domicilio_legal: textoOpcional(ficha.domicilio_legal) ?? null,
          telefono: ficha.telefono,
          email: emailOpcional(ficha.email) ?? null,
          representante_legal_nombre: ficha.representante_legal_nombre,
          representante_legal_rut: claveRut(ficha.representante_legal_rut),
          representante_legal_telefono: textoOpcional(ficha.representante_legal_telefono) ?? null,
          notas_internas: textoOpcional(ficha.notas_internas) ?? null,
        },
      });
      if (rut !== claveRut(actual.rut)) {
        await tx.tenant.updateMany({ where: { empresa_id: id }, data: { rut } });
      }
      return actualizada;
    });

    return empresa;
  }),

  invitarAdmin: nucleoProcedure
    .input(
      z.object({
        tenant_id: z.string().uuid(),
        email: z.string().email("Email inválido"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const local = await ctx.prisma.tenant.findUnique({
        where: { id: input.tenant_id },
        select: { id: true, nombre: true },
      });
      if (!local) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Local no encontrado." });
      }
      return invitarAdminLocal({
        tenantId: local.id,
        tenantNombre: local.nombre,
        email: input.email,
        invitadorId: ctx.userId,
      });
    }),
});
