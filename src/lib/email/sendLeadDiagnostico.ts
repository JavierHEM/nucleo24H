import { getResend, FROM_EMAIL } from "./resend";
import { APP_NAME } from "@/lib/branding";
import { escapeHtml } from "@/lib/escapeHtml";

type LeadParaAviso = {
  nombre: string;
  local: string;
  telefono: string;
  tipo_local: string;
  mensaje: string | null;
};

export async function sendLeadDiagnostico(lead: LeadParaAviso): Promise<void> {
  const destino = process.env.LEADS_NOTIFY_EMAIL;
  const resend = getResend();
  if (!destino || !resend) {
    console.info("[sendLeadDiagnostico] Aviso omitido: falta LEADS_NOTIFY_EMAIL o RESEND_API_KEY.");
    return;
  }

  const filas = [
    ["Nombre", lead.nombre],
    ["Local", lead.local],
    ["Teléfono", lead.telefono],
    ["Tipo de local", lead.tipo_local],
    ["Mensaje", lead.mensaje ?? "—"],
  ]
    .map(
      ([etiqueta, valor]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5B6980;font-weight:700;vertical-align:top">${etiqueta}</td><td style="padding:6px 0;color:#0B1B33">${escapeHtml(valor)}</td></tr>`
    )
    .join("");

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: destino,
    subject: `Nueva solicitud de diagnóstico — ${lead.local}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px"><h2 style="color:#0B1B33;margin:0 0 12px">${escapeHtml(APP_NAME)}: nueva solicitud de diagnóstico</h2><table>${filas}</table></div>`,
  });

  if (error) {
    throw new Error(`Resend rechazó el aviso de lead: ${error.message}`);
  }
}
