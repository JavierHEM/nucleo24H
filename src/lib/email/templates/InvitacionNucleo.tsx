import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Heading,
  Hr,
  Button,
} from "@react-email/components";
import { APP_NAME, APP_FOOTER, LOGO_PATHS, absoluteAssetUrl } from "@/lib/branding";

interface Props {
  nombre: string;
  invitadoPor: string;
  linkAcceso: string;
}

export function InvitacionNucleoEmail({ nombre, invitadoPor, linkAcceso }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={{ backgroundColor: "#F4F6F3", fontFamily: "Inter, sans-serif" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "32px 0" }}>
          <Section
            style={{
              backgroundColor: "#0B1B33",
              borderRadius: "12px 12px 0 0",
              padding: "28px 32px",
            }}
          >
            <Img src={absoluteAssetUrl(LOGO_PATHS.negativo)} width={176} alt={APP_NAME} style={{ display: "block", height: "auto" }} />
            <Heading
              style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "8px 0 0 0" }}
            >
              Invitación a casa central
            </Heading>
          </Section>

          <Section style={{ backgroundColor: "#FFFFFF", padding: "32px" }}>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              Hola <strong>{nombre}</strong>,
            </Text>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              <strong>{invitadoPor}</strong> te invitó a administrar{" "}
              <strong>{APP_NAME}</strong>. Con esta cuenta puedes ver los locales,
              los asesores y la cobranza.
            </Text>
            <Text style={{ fontSize: 14, color: "#5B6980", margin: "0 0 24px 0" }}>
              Crea tu contraseña con el botón. El enlace expira en 24 horas.
            </Text>
            <Section style={{ textAlign: "center" }}>
              <Button
                href={linkAcceso}
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
                Crear cuenta y acceder
              </Button>
            </Section>
            <Hr style={{ borderColor: "#DDE3EA", margin: "24px 0" }} />
            <Text style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
              Si no esperabas esta invitación, ignora el correo.
            </Text>
          </Section>

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
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
