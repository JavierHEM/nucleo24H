import { render } from "@react-email/render";
import { getResend, FROM_EMAIL } from "./resend";
import { SelloEmitidoEmail } from "./templates/SelloEmitido";
import { getAppUrl } from "@/lib/branding";

interface SendSelloEmitidoParams {
  to: string;
  nombreLocal: string;
  periodo: string;
  nivel: string;
  scoreGeneral: number;
  scoreDocumentacion: number;
  scoreCondiciones: number;
  scoreCapacitaciones: number;
  scoreTareas: number;
  planMejoras: string[];
  descargosHabilitados: boolean;
}

export async function sendSelloEmitido(params: SendSelloEmitidoParams) {
  const resend = getResend();
  if (!resend) {
    console.info("[sendSelloEmitido] RESEND_API_KEY no configurada. Email omitido.");
    return null;
  }
  const {
    to,
    nombreLocal,
    periodo,
    nivel,
    scoreGeneral,
    ...rest
  } = params;

  const appUrl = getAppUrl();

  const [year, month] = periodo.split("-");
  const periodoDisplay = new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleString("es-CL", { month: "long", year: "numeric" });

  const html = await render(
    SelloEmitidoEmail({
      nombreLocal,
      periodo,
      nivel,
      scoreGeneral,
      appUrl,
      ...rest,
    })
  );

  const nivelLabel: Record<string, string> = {
    inicial: "Inicial",
    intermedio: "Intermedio",
    avanzado: "Avanzado",
    premium: "Premium ⭐",
  };

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🏅 Sello ${nivelLabel[nivel] ?? nivel} emitido — ${nombreLocal} · ${periodoDisplay}`,
    html,
  });

  if (error) {
    console.error("[sendSelloEmitido] Error Resend:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return data;
}
