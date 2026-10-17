import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Row,
  Column,
  Button,
} from "@react-email/components";
import { APP_NAME_UPPER, APP_FOOTER } from "@/lib/branding";

interface Props {
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
  appUrl: string;
}

const NIVEL_COLOR: Record<string, string> = {
  inicial: "#B42318",
  intermedio: "#D97706",
  avanzado: "#2F6B2A",
  premium: "#0B1B33",
};

const NIVEL_LABEL: Record<string, string> = {
  inicial: "Sello Inicial",
  intermedio: "Sello Intermedio",
  avanzado: "Sello Avanzado",
  premium: "Sello Premium ⭐",
};

export function SelloEmitidoEmail({
  nombreLocal,
  periodo,
  nivel,
  scoreGeneral,
  scoreDocumentacion,
  scoreCondiciones,
  scoreCapacitaciones,
  scoreTareas,
  planMejoras,
  descargosHabilitados,
  appUrl,
}: Props) {
  const nivelColor = NIVEL_COLOR[nivel] ?? "#0B1B33";
  const nivelLabel = NIVEL_LABEL[nivel] ?? nivel;

  const [year, month] = periodo.split("-");
  const periodoDisplay = new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleString("es-CL", { month: "long", year: "numeric" });

  return (
    <Html lang="es">
      <Head />
      <Body style={{ backgroundColor: "#F4F6F3", fontFamily: "Inter, sans-serif" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "32px 0" }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#0B1B33",
              borderRadius: "12px 12px 0 0",
              padding: "28px 32px",
            }}
          >
            <Text
              style={{ color: "#2F6B2A", fontWeight: 700, fontSize: 13, margin: 0 }}
            >
              {APP_NAME_UPPER}
            </Text>
            <Heading
              style={{
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: 700,
                margin: "8px 0 0 0",
              }}
            >
              🏅 Sello mensual emitido
            </Heading>
          </Section>

          {/* Body */}
          <Section
            style={{
              backgroundColor: "#FFFFFF",
              padding: "32px",
            }}
          >
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 8px 0" }}>
              Hola, te informamos que el sello de cumplimiento BPM de{" "}
              <strong>{nombreLocal}</strong> para{" "}
              <strong>{periodoDisplay}</strong> ha sido emitido.
            </Text>

            {/* Sello badge */}
            <Section
              style={{
                backgroundColor: "#F4F6F3",
                borderRadius: 12,
                padding: "20px 24px",
                marginTop: 20,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: nivelColor,
                  margin: "0 0 4px 0",
                  lineHeight: "1",
                }}
              >
                {scoreGeneral.toFixed(1)}%
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: nivelColor,
                  margin: 0,
                  textTransform: "capitalize",
                }}
              >
                {nivelLabel}
              </Text>
            </Section>

            {/* Desglose */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#5B6980",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
              }}
            >
              Desglose
            </Text>
            {[
              { label: "Documentación (30%)", score: scoreDocumentacion },
              { label: "Condiciones (25%)", score: scoreCondiciones },
              { label: "Capacitaciones (25%)", score: scoreCapacitaciones },
              { label: "Tareas (20%)", score: scoreTareas },
            ].map((cat) => (
              <Row key={cat.label} style={{ marginBottom: 8 }}>
                <Column style={{ width: "60%" }}>
                  <Text
                    style={{ fontSize: 14, color: "#334155", margin: 0 }}
                  >
                    {cat.label}
                  </Text>
                </Column>
                <Column style={{ width: "40%", textAlign: "right" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        cat.score >= 80
                          ? "#2F6B2A"
                          : cat.score >= 60
                          ? "#D97706"
                          : "#B42318",
                      margin: 0,
                    }}
                  >
                    {cat.score.toFixed(1)}%
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: "#DDE3EA", margin: "20px 0" }} />

            {/* Plan de mejoras */}
            {planMejoras.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#5B6980",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 10px 0",
                  }}
                >
                  Plan de mejoras
                </Text>
                {planMejoras.map((mejora, i) => (
                  <Text
                    key={i}
                    style={{
                      fontSize: 14,
                      color: "#334155",
                      margin: "0 0 6px 0",
                      paddingLeft: 16,
                    }}
                  >
                    {i + 1}. {mejora}
                  </Text>
                ))}
                <Hr style={{ borderColor: "#DDE3EA", margin: "20px 0" }} />
              </>
            )}

            {/* Descargos */}
            {descargosHabilitados && (
              <Section
                style={{
                  backgroundColor: "#0B1B33",
                  borderRadius: 10,
                  padding: "14px 18px",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: 700, color: "#FFD700", margin: 0 }}
                >
                  ⭐ Descargos administrativos habilitados
                </Text>
                <Text
                  style={{ fontSize: 13, color: "#FFFFFF", opacity: 0.8, margin: "6px 0 0 0" }}
                >
                  Como local Premium, tienes derecho a descargos gratuitos ante la autoridad
                  sanitaria. Contacta a tu asesor.
                </Text>
              </Section>
            )}

            {/* CTA */}
            <Section style={{ textAlign: "center", marginTop: 8 }}>
              <Button
                href={`${appUrl}/sellos`}
                style={{
                  backgroundColor: "#2F6B2A",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  padding: "12px 28px",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Ver sello en el portal
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: "#F4F6F3",
              borderRadius: "0 0 12px 12px",
              padding: "18px 32px",
              textAlign: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
              {APP_FOOTER}
            </Text>
            <Text style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0 0" }}>
              Este mensaje fue generado automáticamente. No respondas a este correo.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
