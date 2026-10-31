import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import QRCode from "qrcode";
import { getAppUrl } from "@/lib/branding";
import { construirHtmlSello } from "@/server/pdf/selloHtml";
import { logoNegativoParaPdf } from "@/server/pdf/logoNegativo";

const querySchema = z.object({
  tenantId: z.string().uuid(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  if (!browserlessToken) {
    return NextResponse.json({ error: "Servicio PDF no configurado" }, { status: 503 });
  }

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validar query params
  const params = querySchema.safeParse({
    tenantId: req.nextUrl.searchParams.get("tenantId"),
    periodo: req.nextUrl.searchParams.get("periodo"),
  });

  if (!params.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { tenantId, periodo } = params.data;

  // Verificar acceso del usuario al tenant
  const hasAccess = await prisma.userTenant.findFirst({
    where: { user_id: user.id, tenant_id: tenantId },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true },
  });

  const esAdminNucleo = dbUser?.rol === "admin_nucleo";
  let asesorAsignado = false;
  if (dbUser?.rol === "asesor") {
    const asignacion = await prisma.asignacionAsesor.findFirst({
      where: { asesor_id: user.id, tenant_id: tenantId, activo: true },
      select: { id: true },
    });
    asesorAsignado = asignacion !== null;
  }

  if (!hasAccess && !esAdminNucleo && !asesorAsignado) {
    return NextResponse.json({ error: "Sin acceso a este tenant" }, { status: 403 });
  }

  // Obtener datos del sello
  const [sello, tenant] = await Promise.all([
    prisma.sello.findUnique({
      where: { tenant_id_periodo: { tenant_id: tenantId, periodo } },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nombre: true, direccion: true },
    }),
  ]);

  if (!sello) {
    return NextResponse.json({ error: "Sello no encontrado para este período" }, { status: 404 });
  }

  const [year, month] = periodo.split("-");
  const periodoDisplay = new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleString("es-CL", { month: "long", year: "numeric" });

  const verificacionUrl = `${getAppUrl()}/sello/${sello.id}`;
  const [qrDataUrl, logoSrc] = await Promise.all([
    QRCode.toString(verificacionUrl, {
      type: "svg",
      margin: 1,
      width: 208,
      color: { dark: "#0B1B33", light: "#FFFFFF" },
    }),
    logoNegativoParaPdf(),
  ]);

  const html = construirHtmlSello({
    local: tenant?.nombre ?? "Local",
    direccion: tenant?.direccion ?? "",
    periodoDisplay,
    nivel: sello.nivel,
    scoreGeneral: sello.score_general,
    scores: {
      score_documentacion: sello.score_documentacion,
      score_condiciones: sello.score_condiciones,
      score_capacitaciones: sello.score_capacitaciones,
      score_tareas: sello.score_tareas,
    },
    emitidoAt: sello.emitido_at,
    planMejoras: (sello.plan_mejoras ?? []) as string[],
    descargosHabilitados: sello.descargos_habilitados,
    selloId: sello.id,
    verificacionUrl,
    qrDataUrl,
    logoSrc,
  });

  try {
    // Browserless v2 REST API
    const response = await fetch(
      `https://production-sfo.browserless.io/pdf?token=${browserlessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          options: {
            format: "A4",
            printBackground: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[pdf/sello] Browserless error:", response.status, errText);
      return NextResponse.json({ error: "Error al generar PDF" }, { status: 502 });
    }

    const pdfBuffer = await response.arrayBuffer();
    const filename = `sello-${tenant?.nombre?.toLowerCase().replace(/\s+/g, "-") ?? "local"}-${periodo}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[pdf/sello] Error:", err);
    return NextResponse.json({ error: "Error interno al generar PDF" }, { status: 500 });
  }
}
