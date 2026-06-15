import type { Prisma, PrismaClient } from "@prisma/client";
import { calcularSello } from "./calcular";
import { PESOS_DEFAULT, UMBRALES_DEFAULT } from "./tipos";
import { sendSelloEmitido } from "@/lib/email/sendSelloEmitido";

interface EmitirSelloParams {
  prisma: PrismaClient;
  tenantId: string;
  periodo: string; // 'YYYY-MM'
  scores: {
    score_documentacion: number;
    score_condiciones: number;
    score_capacitaciones: number;
    score_tareas: number;
  };
  /** user_id del asesor, o 'system' para emisión automática */
  emitidoPor: string;
  /** Datos crudos que respaldan los scores (auditoría) */
  inputsSnapshot?: Prisma.InputJsonValue;
  /** Si el sello ya existe, no lo sobreescribe (default: sobreescribe) */
  noSobreescribir?: boolean;
}

/**
 * Emite (o actualiza) el sello de un tenant: carga la configuración vigente
 * de pesos/umbrales, calcula nivel y plan de mejoras, persiste y notifica
 * por email a los usuarios del local.
 */
export async function emitirSello({
  prisma,
  tenantId,
  periodo,
  scores,
  emitidoPor,
  inputsSnapshot,
  noSobreescribir = false,
}: EmitirSelloParams) {
  if (noSobreescribir) {
    const existente = await prisma.sello.findUnique({
      where: { tenant_id_periodo: { tenant_id: tenantId, periodo } },
      select: { id: true },
    });
    if (existente) return { sello: null, omitido: true as const };
  }

  const config = await prisma.configuracionSellos.findFirst({
    orderBy: { updated_at: "desc" },
  });

  const pesos = config
    ? {
        documentacion: config.peso_documentacion,
        condiciones: config.peso_condiciones,
        capacitaciones: config.peso_capacitaciones,
        tareas: config.peso_tareas,
      }
    : PESOS_DEFAULT;

  const umbrales = config
    ? {
        intermedio: config.umbral_intermedio,
        avanzado: config.umbral_avanzado,
        premium: config.umbral_premium,
      }
    : UMBRALES_DEFAULT;

  const resultado = calcularSello({ ...scores, pesos, umbrales });

  const datos = {
    nivel: resultado.nivel,
    score_general: resultado.score_general,
    score_documentacion: resultado.score_documentacion,
    score_condiciones: resultado.score_condiciones,
    score_capacitaciones: resultado.score_capacitaciones,
    score_tareas: resultado.score_tareas,
    plan_mejoras: resultado.plan_mejoras,
    descargos_habilitados: resultado.descargos_habilitados,
    pesos_usados: resultado.pesos_usados,
    inputs_snapshot: inputsSnapshot ?? scores,
    emitido_por: emitidoPor,
  };

  const sello = await prisma.sello.upsert({
    where: { tenant_id_periodo: { tenant_id: tenantId, periodo } },
    create: { tenant_id: tenantId, periodo, ...datos },
    update: datos,
  });

  void notificarEmision(prisma, tenantId, periodo, resultado);

  return { sello, omitido: false as const };
}

async function notificarEmision(
  prisma: PrismaClient,
  tenantId: string,
  periodo: string,
  resultado: ReturnType<typeof calcularSello>
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nombre: true },
    });

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
        scoreDocumentacion: resultado.score_documentacion,
        scoreCondiciones: resultado.score_condiciones,
        scoreCapacitaciones: resultado.score_capacitaciones,
        scoreTareas: resultado.score_tareas,
        planMejoras: resultado.plan_mejoras,
        descargosHabilitados: resultado.descargos_habilitados,
      }).catch((err: unknown) => {
        console.error("[emitirSello] Error enviando email a", miembro.user.email, err);
      });
    }
  } catch (err) {
    console.error("[emitirSello] Error al notificar por email:", err);
  }
}
