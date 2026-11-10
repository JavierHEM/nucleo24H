import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { requireAuth, requireNucleo } from "@/server/middleware/rbac";
import { parseRuta } from "@/lib/storage/rutas";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES_TUTORIAL, esRolTutorial, etiquetaRolesTutorial, puedeVerTutorial } from "@/lib/tutoriales";

const nucleoProcedure = publicProcedure.use(requireNucleo);
const authProcedure = publicProcedure.use(requireAuth);

const payloadSchema = z.object({
  titulo: z.string().trim().min(3, "Ingresa un título").max(120),
  descripcion: z.string().trim().max(500).default(""),
  ruta_video: z.string().min(8),
  roles: z.array(z.enum(ROLES_TUTORIAL)).max(ROLES_TUTORIAL.length),
  activo: z.boolean().optional(),
});

function idDesdeRuta(ruta: string) {
  const parsed = parseRuta(ruta);
  if (!parsed || parsed.bucket !== "tutoriales") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "El archivo no es un video de tutoriales.",
    });
  }
  return parsed.tenantId;
}

async function borrarVideo(ruta: string) {
  const parsed = parseRuta(ruta);
  if (!parsed || parsed.bucket !== "tutoriales") return;
  const admin = createAdminClient();
  await admin.storage.from("tutoriales").remove([parsed.path]).catch((error) => {
    console.error("[tutoriales] No se pudo borrar el video", error);
  });
}

function rolesUnicos(roles: readonly string[]) {
  return [...new Set(roles.filter(esRolTutorial))];
}

export const tutorialesRouter = router({
  list: authProcedure.query(async ({ ctx }) => {
    const esAdmin = ctx.userRole === "admin_nucleo";
    const filas = await ctx.prisma.tutorial.findMany({
      where: esAdmin
        ? undefined
        : { activo: true, roles_acceso: { has: ctx.userRole ?? "" } },
      orderBy: { created_at: "desc" },
    });

    return filas
      .filter((tutorial) =>
        puedeVerTutorial({
          rol: ctx.userRole,
          activo: tutorial.activo,
          roles: tutorial.roles_acceso,
        })
      )
      .map((tutorial) => ({
        id: tutorial.id,
        titulo: tutorial.titulo,
        descripcion: tutorial.descripcion,
        ruta_video: tutorial.ruta_video,
        activo: tutorial.activo,
        created_at: tutorial.created_at,
        roles: tutorial.roles_acceso,
        rolesLabel: etiquetaRolesTutorial(tutorial.roles_acceso),
      }));
  }),

  get: authProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tutorial = await ctx.prisma.tutorial.findUnique({ where: { id: input.id } });
      if (!tutorial) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos ese tutorial." });
      }
      const permitido = puedeVerTutorial({
        rol: ctx.userRole,
        activo: tutorial.activo,
        roles: tutorial.roles_acceso,
      });
      if (!permitido) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a este video." });
      }

      return {
        id: tutorial.id,
        titulo: tutorial.titulo,
        descripcion: tutorial.descripcion,
        ruta_video: tutorial.ruta_video,
        activo: tutorial.activo,
        created_at: tutorial.created_at,
        roles: tutorial.roles_acceso,
      };
    }),

  crear: nucleoProcedure.input(payloadSchema).mutation(async ({ ctx, input }) => {
    const id = idDesdeRuta(input.ruta_video);
    return ctx.prisma.tutorial.create({
      data: {
        id,
        titulo: input.titulo,
        descripcion: input.descripcion,
        ruta_video: input.ruta_video,
        creado_por: ctx.userId,
        roles_acceso: rolesUnicos(input.roles),
      },
    });
  }),

  actualizar: nucleoProcedure
    .input(payloadSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const actual = await ctx.prisma.tutorial.findUnique({ where: { id: input.id } });
      if (!actual) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos ese tutorial." });
      }
      const idVideo = idDesdeRuta(input.ruta_video);
      if (idVideo !== input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El video nuevo tiene que quedar en el mismo tutorial.",
        });
      }
      if (actual.ruta_video !== input.ruta_video) {
        await borrarVideo(actual.ruta_video);
      }
      return ctx.prisma.tutorial.update({
        where: { id: input.id },
        data: {
          titulo: input.titulo,
          descripcion: input.descripcion,
          ruta_video: input.ruta_video,
          activo: input.activo ?? actual.activo,
          roles_acceso: rolesUnicos(input.roles),
        },
      });
    }),

  eliminar: nucleoProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tutorial = await ctx.prisma.tutorial.findUnique({ where: { id: input.id } });
      if (!tutorial) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos ese tutorial." });
      }
      await borrarVideo(tutorial.ruta_video);
      await ctx.prisma.tutorial.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
