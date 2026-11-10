import type { Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { sendSelloEmitido } from "@/lib/email/sendSelloEmitido";
import { recolectarSelloV2 } from "./recolectar";
import type { ResultadoSelloV2 } from "@/lib/sellos/v2";

function exigirDocumentosParaSello(resultado: ResultadoSelloV2) {
  if (!resultado.bloqueo_documentos) return;
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message:
      resultado.plan_mejoras[0] ??
      "Este local no puede obtener el sello de Núcleo: falta resolución sanitaria y/o patente comercial al día.",
  });
}

function datosV2(resultado: ResultadoSelloV2, snapshot: Prisma.InputJsonValue, propuestoPor: string) {
  return {
    esquema: "v2",
    nivel: resultado.nivel,
    score_general: resultado.score_general,
    score_seguimiento: resultado.score_seguimiento,
    score_visita: resultado.score_visita,
    scores_componentes: resultado.componentes,
    bloqueo_critico: resultado.bloqueo_critico,
    plan_mejoras: resultado.plan_mejoras,
    descargos_habilitados: false,
    pesos_usados: { seguimiento: 60, visita: 40 },
    inputs_snapshot: snapshot,
    propuesto_por: propuestoPor,
    emitido_por: propuestoPor,
    score_documentacion: 0,
    score_condiciones: 0,
    score_capacitaciones: 0,
    score_tareas: 0,
  };
}

export async function proponerSelloV2(args: {
  prisma: PrismaClient;
  tenantId: string;
  periodo: string;
  userId: string;
}) {
  const { resultado, detalle } = await recolectarSelloV2(args.prisma, args.tenantId, args.periodo);
  exigirDocumentosParaSello(resultado);
  const existente = await args.prisma.sello.findUnique({
    where: { tenant_id_periodo: { tenant_id: args.tenantId, periodo: args.periodo } },
  });
  if (existente?.estado === "emitido" && existente.esquema === "v2") {
    return { sello: existente, yaEmitido: true as const };
  }
  const datos = {
    ...datosV2(resultado, detalle as Prisma.InputJsonValue, args.userId),
    estado: "propuesto",
    aprobado_por: null,
    aprobado_at: null,
    rechazo_motivo: null,
  };
  const sello = await args.prisma.sello.upsert({
    where: { tenant_id_periodo: { tenant_id: args.tenantId, periodo: args.periodo } },
    create: { tenant_id: args.tenantId, periodo: args.periodo, ...datos },
    update: datos,
  });
  return { sello, yaEmitido: false as const, resultado };
}

export async function aprobarSelloV2(args: {
  prisma: PrismaClient;
  tenantId: string;
  periodo: string;
  userId: string;
}) {
  const { resultado, detalle } = await recolectarSelloV2(args.prisma, args.tenantId, args.periodo);
  exigirDocumentosParaSello(resultado);
  const datos = {
    ...datosV2(resultado, detalle as Prisma.InputJsonValue, args.userId),
    estado: "emitido",
    aprobado_por: args.userId,
    aprobado_at: new Date(),
    emitido_por: args.userId,
    emitido_at: new Date(),
    rechazo_motivo: null,
  };
  const sello = await args.prisma.sello.upsert({
    where: { tenant_id_periodo: { tenant_id: args.tenantId, periodo: args.periodo } },
    create: { tenant_id: args.tenantId, periodo: args.periodo, ...datos },
    update: datos,
  });
  await notificar(args.prisma, args.tenantId, args.periodo, resultado);
  return sello;
}

export async function rechazarSelloV2(args: {
  prisma: PrismaClient;
  tenantId: string;
  periodo: string;
  userId: string;
  motivo: string;
}) {
  return args.prisma.sello.update({
    where: { tenant_id_periodo: { tenant_id: args.tenantId, periodo: args.periodo } },
    data: {
      estado: "rechazado",
      rechazo_motivo: args.motivo,
      aprobado_por: args.userId,
    },
  });
}

async function notificar(
  prisma: PrismaClient,
  tenantId: string,
  periodo: string,
  resultado: ResultadoSelloV2
) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombre: true } });
    const miembros = await prisma.userTenant.findMany({
      where: { tenant_id: tenantId },
      include: { user: { select: { email: true } } },
    });
    for (const miembro of miembros) {
      if (!miembro.user.email) continue;
      await sendSelloEmitido({
        to: miembro.user.email,
        nombreLocal: tenant?.nombre ?? "Tu local",
        periodo,
        nivel: resultado.nivel,
        scoreGeneral: resultado.score_general,
        scoreDocumentacion: resultado.score_seguimiento,
        scoreCondiciones: resultado.score_visita,
        scoreCapacitaciones: 0,
        scoreTareas: 0,
        planMejoras: resultado.plan_mejoras,
        descargosHabilitados: false,
      }).catch((err: unknown) => {
        console.error("[aprobarSelloV2] mail", miembro.user.email, err);
      });
    }
  } catch (err) {
    console.error("[aprobarSelloV2] notificar", err);
  }
}
