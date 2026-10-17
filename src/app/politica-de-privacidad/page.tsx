import Link from "next/link";
import { IconShield, IconArrowLeft } from "@tabler/icons-react";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — Nucleo 24H",
  description:
    "Política de privacidad y tratamiento de datos personales de Nucleo 24H, conforme a la Ley 21.719.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F3]">
      <header className="bg-[#0B1B33] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2F6B2A] flex items-center justify-center font-bold text-white text-sm">
              N
            </div>
            <span className="font-bold text-white">Nucleo 24H</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <IconArrowLeft size={16} />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-[#DDE3EA] p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <IconShield size={28} className="text-[#2F6B2A]" />
            <h1 className="text-3xl font-bold text-[#0B1B33]">Política de Privacidad</h1>
          </div>
          <p className="text-[#5B6980] text-sm mb-10">
            Versión 1.0 — Vigente desde el 1 de diciembre de 2026
          </p>

          <div className="space-y-10 text-[#334155]">
            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                1. Responsable del tratamiento
              </h2>
              <p className="text-sm leading-relaxed">
                <strong>Nucleo 24H SpA</strong> (en adelante, &quot;Nucleo 24H&quot;), RUT XX.XXX.XXX-X,
                con domicilio en Osorno, Región de Los Lagos, Chile, es el responsable del
                tratamiento de sus datos personales.
              </p>
              <p className="text-sm leading-relaxed mt-2">
                Contacto para asuntos de privacidad:{" "}
                <a href="mailto:privacidad@nucleosur.cl" className="text-[#2F6B2A] underline">
                  privacidad@nucleosur.cl
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                2. Datos personales que tratamos
              </h2>
              <ul className="text-sm space-y-2 pl-4">
                {[
                  ["Datos de identificación", "nombre completo, RUT, correo electrónico, dirección"],
                  ["Datos del local", "nombre comercial, RUT, dirección, plan contratado"],
                  ["Datos de uso", "registros BPM, documentos subidos, resultados de capacitaciones"],
                  ["Datos técnicos", "dirección IP, tipo de dispositivo, logs de acceso"],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex gap-2 items-start">
                    <span className="text-[#2F6B2A] mt-1 shrink-0">•</span>
                    <span><strong>{bold}:</strong> {rest}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                3. Finalidades del tratamiento
              </h2>
              <ul className="text-sm space-y-2 pl-4">
                {[
                  "Prestación del servicio de gestión de cumplimiento sanitario BPM",
                  "Cálculo y emisión del Sello de Cumplimiento mensual",
                  "Gestión de documentos y capacitaciones",
                  "Comunicación sobre el estado del servicio y vencimientos",
                  "Cumplimiento de obligaciones legales",
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                    <span className="text-[#2F6B2A] mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                4. Base de legitimación
              </h2>
              <p className="text-sm leading-relaxed">
                El tratamiento se basa en el <strong>consentimiento expreso</strong> del titular
                (Art. 12 Ley 21.719) otorgado al momento del registro, y en la{" "}
                <strong>ejecución del contrato</strong> de servicio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                5. Encargados de tratamiento (subprocesadores)
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[#DDE3EA]">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#0B1B33]">Proveedor</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0B1B33]">País</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0B1B33]">Finalidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {[
                      ["Supabase Inc.", "EE.UU. (datos en Brasil)", "Base de datos y autenticación"],
                      ["Cloudflare Inc.", "EE.UU.", "Almacenamiento de archivos (R2)"],
                      ["Resend Inc.", "EE.UU.", "Envío de correos transaccionales"],
                      ["Vercel Inc.", "EE.UU.", "Infraestructura de la aplicación"],
                    ].map(([prov, pais, fin]) => (
                      <tr key={prov}>
                        <td className="px-4 py-3">{prov}</td>
                        <td className="px-4 py-3 text-[#5B6980]">{pais}</td>
                        <td className="px-4 py-3 text-[#5B6980]">{fin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#5B6980] mt-3">
                Todos los encargados cuentan con Acuerdo de Procesamiento de Datos (DPA) firmado
                y ofrecen garantías adecuadas conforme a la Ley 21.719.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                6. Sus derechos (ARSOPB)
              </h2>
              <p className="text-sm leading-relaxed mb-3">
                Conforme a la Ley 21.719, usted tiene los siguientes derechos:
              </p>
              <ul className="text-sm space-y-2 pl-4">
                {[
                  ["Acceso (Art. 5°)", "conocer qué datos tratamos sobre usted"],
                  ["Rectificación (Art. 6°)", "corregir datos inexactos o incompletos"],
                  ["Supresión (Art. 7°)", "solicitar la eliminación de sus datos"],
                  ["Oposición", "oponerse al tratamiento en ciertos casos"],
                  ["Portabilidad (Art. 9°)", "recibir sus datos en formato estructurado y legible"],
                  ["Bloqueo", "suspender temporalmente el tratamiento de sus datos"],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex gap-2 items-start">
                    <span className="text-[#2F6B2A] mt-1 shrink-0">•</span>
                    <span><strong>{bold}:</strong> {rest}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm mt-3">
                Para ejercer sus derechos, ingresa a{" "}
                <strong>Mi Cuenta → Mis Derechos</strong> dentro de la plataforma, o envía tu
                solicitud a{" "}
                <a href="mailto:privacidad@nucleosur.cl" className="text-[#2F6B2A] underline">
                  privacidad@nucleosur.cl
                </a>
                . Responderemos dentro de <strong>30 días corridos</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                7. Retención de datos
              </h2>
              <p className="text-sm leading-relaxed">
                Conservamos sus datos mientras mantenga un contrato activo con Nucleo 24H.
                Tras la baja del servicio, sus datos se eliminan automáticamente dentro de los
                90 días siguientes, salvo obligación legal de conservación.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                8. Seguridad
              </h2>
              <p className="text-sm leading-relaxed">
                Implementamos medidas técnicas y organizativas para proteger sus datos,
                incluyendo cifrado en tránsito (TLS 1.3) y en reposo, aislamiento por tenant
                mediante Row-Level Security (PostgreSQL), y controles de acceso basados en roles.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0B1B33] mb-3">
                9. Cambios a esta política
              </h2>
              <p className="text-sm leading-relaxed">
                Cualquier modificación sustancial será notificada por correo electrónico con al
                menos 15 días de anticipación. La versión vigente siempre está disponible en
                esta página.
              </p>
            </section>

            <div className="border-t border-[#DDE3EA] pt-6 text-xs text-[#94A3B8]">
              <p>Última actualización: 1 de diciembre de 2026 — Versión 1.0</p>
              <p className="mt-1">
                En caso de conflicto entre esta política y la normativa vigente, prevalece la{" "}
                <a
                  href="https://bcn.cl/gJo3hf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2F6B2A] underline"
                >
                  Ley N° 21.719
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
