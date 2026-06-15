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
  nombre: string;
  invitadoPor: string;
  linkAcceso: string;
}

export function InvitacionAsesorEmail({ nombre, invitadoPor, linkAcceso }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={{ backgroundColor: "#F5F6F8", fontFamily: "Inter, sans-serif" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "32px 0" }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#0D1F3C",
              borderRadius: "12px 12px 0 0",
              padding: "28px 32px",
            }}
          >
            <Text style={{ color: "#3D7A35", fontWeight: 700, fontSize: 13, margin: 0 }}>
              NÚCLEO SUR
            </Text>
            <Heading
              style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "8px 0 0 0" }}
            >
              Has sido invitado como Asesor
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: "#FFFFFF", padding: "32px" }}>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              Hola <strong>{nombre}</strong>,
            </Text>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              <strong>{invitadoPor}</strong> te ha invitado a unirte a{" "}
              <strong>Núcleo Sur</strong> como <strong>Asesor BPM</strong>. Podrás
              gestionar y supervisar los locales que se te asignen desde el portal.
            </Text>

            <Section
              style={{
                backgroundColor: "#EAF3E0",
                borderRadius: 10,
                padding: "16px 20px",
                margin: "20px 0",
              }}
            >
              <Text style={{ fontSize: 14, color: "#2D5A27", fontWeight: 600, margin: 0 }}>
                ¿Qué puedes hacer como Asesor?
              </Text>
              <Text style={{ fontSize: 14, color: "#334155", margin: "10px 0 0 0" }}>
                ✓ Revisar registros y documentos de tus locales asignados
              </Text>
              <Text style={{ fontSize: 14, color: "#334155", margin: "6px 0 0 0" }}>
                ✓ Aprobar o gestionar revisiones de sellos BPM
              </Text>
              <Text style={{ fontSize: 14, color: "#334155", margin: "6px 0 0 0" }}>
                ✓ Comunicarte directamente con los administradores de locales
              </Text>
              <Text style={{ fontSize: 14, color: "#334155", margin: "6px 0 0 0" }}>
                ✓ Acceder a informes consolidados de cumplimiento
              </Text>
            </Section>

            <Text style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px 0" }}>
              Haz clic en el botón para crear tu contraseña y acceder al portal:
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button
                href={linkAcceso}
                style={{
                  backgroundColor: "#3D7A35",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  padding: "12px 28px",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Crear cuenta y acceder
              </Button>
            </Section>

            <Hr style={{ borderColor: "#E2E8F0", margin: "24px 0" }} />

            <Text style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
              Si no solicitaste esta invitación, puedes ignorar este correo. El enlace
              expira en 24 horas.
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
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
