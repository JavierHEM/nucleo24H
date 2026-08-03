import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { APP_NAME, APP_FOOTER } from "@/lib/branding";

const querySchema = z.object({
  tenantId: z.string().uuid(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

const NIVEL_COLOR: Record<string, string> = {
  inicial: "#DC2626",
  intermedio: "#D97706",
  avanzado: "#16A34A",
  premium: "#0B2545",
};

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

  const isAsesorOrAdmin = dbUser?.rol === "asesor" || dbUser?.rol === "admin_nucleo";

  if (!hasAccess && !isAsesorOrAdmin) {
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

  const nivelColor = NIVEL_COLOR[sello.nivel] ?? "#0B2545";
  const planMejoras = (sello.plan_mejoras ?? []) as string[];

  // HTML del PDF
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sello ${periodoDisplay} — ${tenant?.nombre ?? ""}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #F8F9FA; color: #0B2545; }
  .page { width: 794px; min-height: 1123px; margin: 0 auto; background: white; padding: 0; }
  .header { background: #0B2545; color: white; padding: 36px 48px 32px; }
  .header-badge { display: inline-block; background: #4B8B2E; color: white; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px; }
  .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 14px; color: rgba(255,255,255,0.65); }
  .body { padding: 40px 48px; }
  .score-section { display: flex; align-items: center; justify-content: space-between; background: #F8F9FA; border-radius: 16px; padding: 28px 32px; margin-bottom: 28px; }
  .score-number { font-size: 72px; font-weight: 900; color: ${nivelColor}; line-height: 1; }
  .score-label { font-size: 20px; font-weight: 700; color: ${nivelColor}; text-transform: capitalize; margin-top: 4px; }
  .score-right { text-align: right; }
  .score-right p { font-size: 13px; color: #64748B; margin-bottom: 4px; }
  .section-title { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; }
  .breakdown { margin-bottom: 28px; }
  .cat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .cat-label { font-size: 13px; color: #334155; width: 240px; flex-shrink: 0; }
  .cat-bar { flex: 1; height: 8px; background: #E2E8F0; border-radius: 9999px; overflow: hidden; }
  .cat-fill { height: 100%; border-radius: 9999px; }
  .cat-score { font-size: 13px; font-weight: 700; width: 48px; text-align: right; flex-shrink: 0; }
  .divider { height: 1px; background: #E2E8F0; margin: 24px 0; }
  .mejoras { margin-bottom: 28px; }
  .mejora-item { display: flex; gap: 12px; margin-bottom: 8px; }
  .mejora-num { width: 22px; height: 22px; border-radius: 50%; background: #EBF5E6; color: #3A6E24; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mejora-text { font-size: 13px; color: #334155; line-height: 1.5; }
  .descargos-banner { background: #0B2545; color: white; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; }
  .descargos-banner p:first-child { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
  .descargos-banner p:last-child { font-size: 12px; opacity: 0.7; }
  .footer { margin-top: auto; border-top: 1px solid #E2E8F0; padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; }
  .footer p { font-size: 11px; color: #94A3B8; }
  .green { color: #16A34A; } .amber { color: #D97706; } .red { color: #DC2626; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-badge">${APP_NAME} · BPM</div>
    <h1>${tenant?.nombre ?? "Local"}</h1>
    <p>${tenant?.direccion ?? ""} &nbsp;·&nbsp; Informe mensual ${periodoDisplay}</p>
  </div>

  <div class="body">
    <!-- Score principal -->
    <div class="score-section">
      <div>
        <div class="score-number">${sello.score_general.toFixed(1)}%</div>
        <div class="score-label">${sello.nivel}</div>
      </div>
      <div class="score-right">
        <p>Período</p>
        <strong>${periodoDisplay}</strong>
        <p style="margin-top:10px">Emitido</p>
        <strong>${new Date(sello.emitido_at).toLocaleDateString("es-CL")}</strong>
      </div>
    </div>

    <!-- Desglose -->
    <div class="breakdown">
      <p class="section-title">Desglose por dimensión</p>
      ${[
        { label: "Documentación y registros (30%)", score: sello.score_documentacion },
        { label: "Condiciones sanitarias (25%)", score: sello.score_condiciones },
        { label: "Capacitaciones (25%)", score: sello.score_capacitaciones },
        { label: "Tareas completadas (20%)", score: sello.score_tareas },
      ]
        .map(
          (cat) => `
      <div class="cat-row">
        <span class="cat-label">${cat.label}</span>
        <div class="cat-bar">
          <div class="cat-fill" style="width:${cat.score}%; background:${cat.score >= 80 ? "#16A34A" : cat.score >= 60 ? "#D97706" : "#DC2626"}"></div>
        </div>
        <span class="cat-score ${cat.score >= 80 ? "green" : cat.score >= 60 ? "amber" : "red"}">${cat.score.toFixed(0)}%</span>
      </div>`
        )
        .join("")}
    </div>

    ${
      planMejoras.length > 0
        ? `<div class="divider"></div>
    <div class="mejoras">
      <p class="section-title">Plan de mejoras</p>
      ${planMejoras.map((m, i) => `<div class="mejora-item"><div class="mejora-num">${i + 1}</div><p class="mejora-text">${m}</p></div>`).join("")}
    </div>`
        : ""
    }

    ${
      sello.descargos_habilitados
        ? `<div class="divider"></div>
    <div class="descargos-banner">
      <p>⭐ Descargos administrativos habilitados</p>
      <p>Como local Premium, dispones de descargos gratuitos ante la autoridad sanitaria. Contacta a tu asesor para utilizarlos.</p>
    </div>`
        : ""
    }
  </div>

  <div class="footer">
    <p>${APP_FOOTER}</p>
    <p>Generado el ${new Date().toLocaleDateString("es-CL")}</p>
  </div>
</div>
</body>
</html>`;

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
