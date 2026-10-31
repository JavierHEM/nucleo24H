"use server";

import { prisma } from "@/server/db/prisma";
import {
  diagnosticoSchema,
  LIMITE_LEADS_POR_HORA,
  LIMITE_LEADS_POR_TELEFONO,
  normalizarTelefono,
} from "@/lib/diagnostico";
import { sendLeadDiagnostico } from "@/lib/email/sendLeadDiagnostico";

type Resultado = { data: { ok: true } } | { error: string };

const ERROR_GENERICO = "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.";

export async function solicitarDiagnostico(entrada: unknown): Promise<Resultado> {
  const parsed = diagnosticoSchema.safeParse(entrada);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario." };
  }

  const { nombre, local, telefono, tipo, mensaje, sitio_web } = parsed.data;
  if (sitio_web) return { data: { ok: true } };

  const telefonoNormalizado = normalizarTelefono(telefono);
  const hace1Hora = new Date(Date.now() - 60 * 60 * 1000);

  try {
    const [porTelefono, porHora] = await Promise.all([
      prisma.lead.count({ where: { telefono: telefonoNormalizado, created_at: { gte: hace1Hora } } }),
      prisma.lead.count({ where: { created_at: { gte: hace1Hora } } }),
    ]);
    if (porTelefono >= LIMITE_LEADS_POR_TELEFONO) {
      return { error: "Ya recibimos tu solicitud. Te contactaremos pronto." };
    }
    if (porHora >= LIMITE_LEADS_POR_HORA) {
      return { error: ERROR_GENERICO };
    }

    const lead = await prisma.lead.create({
      data: {
        nombre,
        local,
        telefono: telefonoNormalizado,
        tipo_local: tipo,
        mensaje: mensaje || null,
      },
    });

    await sendLeadDiagnostico({
      nombre: lead.nombre,
      local: lead.local,
      telefono: lead.telefono,
      tipo_local: lead.tipo_local,
      mensaje: lead.mensaje,
    }).catch((error: unknown) => {
      console.error("[solicitarDiagnostico] Lead guardado pero falló el aviso por correo:", error, { leadId: lead.id });
    });

    return { data: { ok: true } };
  } catch (error) {
    console.error("[solicitarDiagnostico] Error guardando lead:", error, { local });
    return { error: ERROR_GENERICO };
  }
}
