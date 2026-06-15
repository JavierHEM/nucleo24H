import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Button,
} from "@react-email/components";

interface Props {
  nombreLocal: string;
  periodo: string;
  montoPendiente?: string;
  appUrl: string;
}

export function AlertaMorosidadEmail({
  nombreLocal,
  periodo,
  montoPendiente,
  appUrl,
}: Props) {
  const [year, month] = periodo.split("-");
  const periodoDisplay = new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleString("es-CL", { month: "long", year: "numeric" });

  return (
    <Html lang="es">
      <Head />
      <Body style={{ backgroundColor: "#F5F6F8", fontFamily: "Inter, sans-serif" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "32px 0" }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#7F1D1D",
              borderRadius: "12px 12px 0 0",
              padding: "28px 32px",
            }}
          >
            <Text style={{ color: "#FCA5A5", fontWeight: 700, fontSize: 13, margin: 0 }}>
              NÚCLEO SUR · AVISO IMPORTANTE
            </Text>
            <Heading
              style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "8px 0 0 0" }}
            >
              ⚠️ Suscripción con pago pendiente
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: "#FFFFFF", padding: "32px" }}>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              Estimado administrador de <strong>{nombreLocal}</strong>,
            </Text>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              Te informamos que la suscripción de <strong>{nombreLocal}</strong> presenta
              un pago pendiente correspondiente al período de{" "}
              <strong>{periodoDisplay}</strong>.
            </Text>

            <Section
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "16px 20px",
                margin: "20px 0",
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: 700, color: "#991B1B", margin: 0 }}
              >
                Estado: Suscripción en mora
              </Text>
              <Text style={{ fontSize: 14, color: "#334155", margin: "8px 0 0 0" }}>
                Período: <strong>{periodoDisplay}</strong>
              </Text>
              {montoPendiente && (
                <Text style={{ fontSize: 14, color: "#334155", margin: "4px 0 0 0" }}>
                  Monto pendiente: <strong>{montoPendiente}</strong>
                </Text>
              )}
            </Section>

            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 8px 0" }}>
              Mientras la suscripción esté en mora, algunas funcionalidades del portal
              pueden estar restringidas.
            </Text>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 24px 0" }}>
              Para regularizar tu situación, ingresa al portal y realiza el pago o
              contacta a tu asesor.
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button
                href={`${appUrl}/suscripcion`}
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  padding: "12px 28px",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Regularizar pago
              </Button>
            </Section>

            <Hr style={{ borderColor: "#E2E8F0", margin: "24px 0" }} />

            <Text style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
              Si ya realizaste el pago, por favor ignora este mensaje o contacta a tu
              asesor para confirmar la regularización.
            </Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: "#F5F6F8",
              borderRadius: "0 0 12px 12px",
              padding: "18px 32px",
              textAlign: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
              Núcleo Sur · Asesoría BPM para establecimientos de alimentos · Osorno, Chile
            </Text>
            <Text style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0 0" }}>
              Este mensaje fue generado automáticamente.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
