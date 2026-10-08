import { getResend, FROM_EMAIL } from "./resend";
import { APP_NAME } from "@/lib/branding";

export async function sendAvisoPlanillaPapel(params: {
  to: string;
  nombreLocal: string;
  codigo: string;
  nombrePlanilla: string;
  archivoUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.info("[sendAvisoPlanillaPapel] RESEND no configurado. Email omitido.");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Planilla en papel para revisar — ${params.codigo}`,
    text: [
      `En ${params.nombreLocal} cargaron la planilla impresa ${params.codigo} (${params.nombrePlanilla}).`,
      "Quedó pendiente de revisión en los registros del local.",
      `Archivo: ${params.archivoUrl}`,
      APP_NAME,
    ].join("\n\n"),
  });

  if (error) {
    console.error("[sendAvisoPlanillaPapel] Error Resend:", error);
    throw new Error(error.message);
  }

  return data;
}
