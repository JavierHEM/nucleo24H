import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import {
  IconUser,
  IconShield,
  IconDownload,
  IconCircleCheck,
} from "@tabler/icons-react";
import { SolicitarDerechoButton } from "./SolicitarDerechoButton";
import { EditarPerfilButton } from "./EditarPerfilButton";

export default async function MiCuentaPage() {
  const caller = await getCaller();

  const datos = await caller.arsopb.misDatos().catch(() => null);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1F3C]">Mi Cuenta</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Tus datos personales y derechos bajo la Ley 21.719
        </p>
      </div>

      {/* Datos del usuario */}
      {datos?.user && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF3E0] flex items-center justify-center">
                <IconUser size={20} className="text-[#3D7A35]" />
              </div>
              <div>
                <p className="font-semibold text-[#0D1F3C]">{datos.user.nombre}</p>
                <p className="text-sm text-[#64748B]">{datos.user.email}</p>
              </div>
            </div>
            <EditarPerfilButton nombreActual={datos.user.nombre ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#F5F6F8] rounded-lg p-3">
              <p className="text-xs text-[#64748B] mb-1">Rol</p>
              <p className="font-medium text-[#0D1F3C] capitalize">{datos.user.rol.replace("_", " ")}</p>
            </div>
            <div className="bg-[#F5F6F8] rounded-lg p-3">
              <p className="text-xs text-[#64748B] mb-1">Miembro desde</p>
              <p className="font-medium text-[#0D1F3C]">{formatDate(datos.user.created_at)}</p>
            </div>
            <div className="bg-[#F5F6F8] rounded-lg p-3">
              <p className="text-xs text-[#64748B] mb-1">Registros BPM</p>
              <p className="font-medium text-[#0D1F3C]">{datos.registros.length}</p>
            </div>
            <div className="bg-[#F5F6F8] rounded-lg p-3">
              <p className="text-xs text-[#64748B] mb-1">Documentos</p>
              <p className="font-medium text-[#0D1F3C]">{datos.documentos.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Consentimientos */}
      {datos?.consentimientos && datos.consentimientos.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
          <p className="text-sm font-semibold text-[#0D1F3C] mb-3">
            Historial de consentimientos
          </p>
          <div className="space-y-2">
            {datos.consentimientos.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 text-sm py-2 border-b border-[#E2E8F0] last:border-0"
              >
                <IconCircleCheck size={16} className="text-[#16A34A] shrink-0" />
                <div className="flex-1">
                  <span className="capitalize text-[#0D1F3C]">{c.tipo}</span>
                  <span className="text-[#64748B] mx-2">·</span>
                  <span className="text-[#64748B] text-xs">v{c.documento_version}</span>
                </div>
                <span className="text-xs text-[#64748B]">
                  {formatDate(c.timestamp_evento)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Derechos ARSOPB — Ley 21.719 */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <IconShield size={18} className="text-[#3D7A35]" />
          <p className="text-sm font-semibold text-[#0D1F3C]">Tus derechos — Ley 21.719</p>
        </div>
        <p className="text-xs text-[#64748B] mb-4">
          Puedes ejercer los siguientes derechos sobre tus datos personales. El plazo de respuesta es de 30 días corridos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { tipo: "acceso" as const, label: "Acceso", desc: "Conocer qué datos tenemos sobre ti" },
            { tipo: "rectificacion" as const, label: "Rectificación", desc: "Corregir datos incorrectos" },
            { tipo: "supresion" as const, label: "Supresión", desc: "Solicitar eliminación de tus datos" },
            { tipo: "oposicion" as const, label: "Oposición", desc: "Oponerte al tratamiento de tus datos" },
            { tipo: "portabilidad" as const, label: "Portabilidad", desc: "Obtener tus datos en formato legible" },
            { tipo: "bloqueo" as const, label: "Bloqueo", desc: "Suspender temporalmente el tratamiento" },
          ].map((derecho) => (
            <SolicitarDerechoButton
              key={derecho.tipo}
              tipo={derecho.tipo}
              label={derecho.label}
              desc={derecho.desc}
            />
          ))}
        </div>
      </div>

      {/* Exportar datos */}
      <div className="bg-[#EAF3E0] rounded-xl border border-green-200 p-5">
        <div className="flex items-start gap-3">
          <IconDownload size={20} className="text-[#2D5A27] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#2D5A27]">Exportar mis datos</p>
            <p className="text-xs text-[#3D7A27] mt-1">
              Ejercicio del derecho de portabilidad (Art. 7, Ley 21.719). Descarga un archivo JSON con todos tus datos personales almacenados en el sistema.
            </p>
            <a
              href="/api/auth/exportar-datos"
              download
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#2D5A27] bg-white/60 hover:bg-white border border-green-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              <IconDownload size={13} />
              Descargar mis datos (JSON)
            </a>
          </div>
        </div>
      </div>

      {/* Link política */}
      <p className="text-xs text-[#64748B]">
        Consulta nuestra{" "}
        <a href="/politica-de-privacidad" className="text-[#3D7A35] underline">
          política de privacidad
        </a>{" "}
        para más información sobre el tratamiento de datos personales.
      </p>
    </div>
  );
}
