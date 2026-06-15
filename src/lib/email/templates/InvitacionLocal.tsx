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
  nombreLocal: string;
  rol: "admin_local" | "trabajador_local";
  invitadoPor: string;
  linkAcceso: string;
}

const ROL_LABEL: Record<string, string> = {
  admin_local: "Administrador del Local",
  trabajador_local: "Colaborador",
};

const ROL_PERMISOS: Record<string, string[]> = {
  admin_local: [
    "Gestionar registros de temperatura, limpieza y más",
    "Administrar documentos y su vigencia",
    "Invitar colaboradores al equipo",
    "Ver sellos de cumplimiento BPM",
    "Comunicarte con tu asesor asignado",
  ],
  trabajador_local: [
    "Completar registros diarios (temperatura, limpieza, etc.)",
    "Ver documentos del local",
    "Acceder a capacitaciones asignadas",
  ],
};

export function InvitacionLocalEmail({
  nombre,
  nombreLocal,
  rol,
  invitadoPor,
  linkAcceso,
}: Props) {
  const rolLabel = ROL_LABEL[rol] ?? rol;
  const permisos = ROL_PERMISOS[rol] ?? [];

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
              Invitación al portal
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: "#FFFFFF", padding: "32px" }}>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              Hola <strong>{nombre}</strong>,
            </Text>
            <Text style={{ fontSize: 15, color: "#334155", margin: "0 0 16px 0" }}>
              <strong>{invitadoPor}</strong> te ha invitado a unirte a{" "}
              <strong>{nombreLocal}</strong> en <strong>Núcleo Sur</strong> como{" "}
              <strong>{rolLabel}</strong>.
            </Text>

            {permisos.length > 0 && (
              <Section
                style={{
                  backgroundColor: "#EAF3E0",
                  borderRadius: 10,
                  padding: "16px 20px",
                  margin: "20px 0",
                }}
              >
                <Text
                  style={{ fontSize: 14, color: "#2D5A27", fontWeight: 600, margin: 0 }}
                >
                  Con tu acceso podrás:
                </Text>
                {permisos.map((p, i) => (
                  <Text
                    key={i}
                    style={{ fontSize: 14, color: "#334155", margin: "6px 0 0 0" }}
                  >
                    ✓ {p}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px 0" }}>
              Haz clic en el botón para crear tu contraseña y comenzar:
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button
                href={linkAcceso}
                style={{
                  backgroundColor: "#1A3559",
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
              Si no esperabas esta invitación, puedes ignorar este correo. El enlace
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
