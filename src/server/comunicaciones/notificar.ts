import type { PrismaClient } from "@prisma/client";

type PrismaLike = Pick<PrismaClient, "notificacion" | "user">;

export async function idsAdminNucleo(prisma: PrismaLike): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { rol: "admin_nucleo", activo: true },
    select: { id: true },
  });
  return admins.map((admin) => admin.id);
}

export async function crearNotificaciones(
  prisma: PrismaLike,
  args: {
    userIds: string[];
    tenantId: string;
    ticketId: string;
    tipo: "ticket_nueva" | "ticket_respuesta" | "ticket_estado";
    titulo: string;
    cuerpo: string;
  }
): Promise<void> {
  const destinatarios = [...new Set(args.userIds)].filter(Boolean);
  if (destinatarios.length === 0) return;

  await prisma.notificacion.createMany({
    data: destinatarios.map((userId) => ({
      user_id: userId,
      tenant_id: args.tenantId,
      ticket_id: args.ticketId,
      tipo: args.tipo,
      titulo: args.titulo,
      cuerpo: args.cuerpo,
      href: `/comunicaciones/${args.ticketId}`,
    })),
  });
}
