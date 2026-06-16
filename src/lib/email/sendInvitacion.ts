import { render } from "@react-email/render";
import { getResend, FROM_EMAIL } from "./resend";
import { InvitacionAsesorEmail } from "./templates/InvitacionAsesor";
import { InvitacionLocalEmail } from "./templates/InvitacionLocal";
import { APP_NAME } from "@/lib/branding";

export async function sendInvitacionAsesor(params: {
  to: string;
  nombre: string;
  invitadoPor: string;
  linkAcceso: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.info("[sendInvitacionAsesor] RESEND no configurado. Email omitido.");
    return null;
  }

  const html = await render(
    InvitacionAsesorEmail({
      nombre: params.nombre,
      invitadoPor: params.invitadoPor,
      linkAcceso: params.linkAcceso,
    })
  );

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Invitación para unirte a ${APP_NAME} como Asesor`,
    html,
  });

  if (error) {
    console.error("[sendInvitacionAsesor] Error Resend:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return data;
}

export async function sendInvitacionLocal(params: {
  to: string;
  nombre: string;
  nombreLocal: string;
  rol: "admin_local" | "trabajador_local";
  invitadoPor: string;
  linkAcceso: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.info("[sendInvitacionLocal] RESEND no configurado. Email omitido.");
    return null;
  }

  const rolLabel =
    params.rol === "admin_local" ? "Administrador del Local" : "Colaborador";

  const html = await render(
    InvitacionLocalEmail({
      nombre: params.nombre,
      nombreLocal: params.nombreLocal,
      rol: params.rol,
      invitadoPor: params.invitadoPor,
      linkAcceso: params.linkAcceso,
    })
  );

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Invitación a ${params.nombreLocal} — ${rolLabel} en ${APP_NAME}`,
    html,
  });

  if (error) {
    console.error("[sendInvitacionLocal] Error Resend:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return data;
}
