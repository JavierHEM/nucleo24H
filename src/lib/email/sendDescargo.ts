import { getResend, FROM_EMAIL } from "./resend";
import { APP_NAME } from "@/lib/branding";

export async function sendAvisoDescargo(params: { to: string; nombreLocal: string; titulo: string; url: string }) {
  const resend = getResend();
  if (!resend) {
    console.info("[sendAvisoDescargo] RESEND no configurado. Email omitido.");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Nueva solicitud de descargo — ${params.nombreLocal}`,
    text: [
      `${params.nombreLocal} abrió una solicitud de descargo: "${params.titulo}".`,
      "Es un beneficio del sello Premium y espera tu revisión.",
      `Revisarla: ${params.url}`,
      APP_NAME,
    ].join("\n\n"),
  });

  if (error) {
    console.error("[sendAvisoDescargo] Error Resend:", error);
    throw new Error(error.message);
  }

  return data;
}
