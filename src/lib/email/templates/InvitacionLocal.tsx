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
  nombreLocal: string;
  rol: "admin_local" | "jefe_local" | "trabajador_local";
  invitadoPor: string;
  linkAcceso: string;
}

const ROL_LABEL: Record<string, string> = {
  admin_local: "Administrador del Local",
  jefe_local: "Jefe de local",
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
  jefe_local: [
    "Registrar y subir las planillas de los locales a tu cargo",
    "Ver documentos, sellos y visitas",
    "Invitar trabajadores al equipo",
    "Comunicarte con el asesor del local",
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
            <Img src={absoluteAssetUrl(LOGO_PATHS.negativo)} width={176} alt={APP_NAME} style={{ display: "block", height: "auto" }} />
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
              <strong>{nombreLocal}</strong> en <strong>{APP_NAME}</strong> como{" "}
              <strong>{rolLabel}</strong>.
            </Text>

            {permisos.length > 0 && (
              <Section
                style={{
                  backgroundColor: "#E5F1E3",
                  borderRadius: 10,
                  padding: "16px 20px",
                  margin: "20px 0",
                }}
              >
                <Text
                  style={{ fontSize: 14, color: "#255620", fontWeight: 600, margin: 0 }}
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

            <Text style={{ fontSize: 14, color: "#5B6980", margin: "0 0 24px 0" }}>
              Haz clic en el botón para crear tu contraseña y comenzar:
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button
                href={linkAcceso}
                style={{
                  backgroundColor: "#16294A",
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
              Si no esperabas esta invitación, puedes ignorar este correo. El enlace
              expira en 24 horas.
            </Text>
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
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
