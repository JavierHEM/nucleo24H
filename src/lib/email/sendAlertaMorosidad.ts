import { render } from "@react-email/render";
import { getResend, FROM_EMAIL } from "./resend";
import { AlertaMorosidadEmail } from "./templates/AlertaMorosidad";
import { getAppUrl } from "@/lib/branding";

export async function sendAlertaMorosidad(params: {
  to: string;
  nombreLocal: string;
  periodo: string;
  montoPendiente?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.info("[sendAlertaMorosidad] RESEND no configurado. Email omitido.");
    return null;
  }

  const appUrl = getAppUrl();

  const html = await render(
    AlertaMorosidadEmail({
      nombreLocal: params.nombreLocal,
      periodo: params.periodo,
      montoPendiente: params.montoPendiente,
      appUrl,
    })
  );

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `⚠️ Pago pendiente — ${params.nombreLocal}`,
    html,
  });

  if (error) {
    console.error("[sendAlertaMorosidad] Error Resend:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return data;
}
