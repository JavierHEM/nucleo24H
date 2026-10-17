import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import QRCode from "qrcode";
import { IconMedal, IconShieldCheck, IconMapPin, IconCalendar, IconCircleCheck } from "@tabler/icons-react";

const NIVEL_CONFIG = {
  inicial: {
    label: "Inicial",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
  },
  intermedio: {
    label: "Intermedio",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
  },
  avanzado: {
    label: "Avanzado",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
  premium: {
    label: "Premium",
    color: "text-[#2F6B2A]",
    bg: "bg-[#E5F1E3]",
    border: "border-green-200",
    badge: "bg-[#E5F1E3] text-[#255620]",
  },
} as const;

type NivelKey = keyof typeof NIVEL_CONFIG;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificadoPage({ params }: PageProps) {
  const { id } = await params;

  const sello = await prisma.sello.findUnique({
    where: { id },
    include: {
      tenant: {
        select: { nombre: true, ciudad: true, rut: true, plan: true },
      },
    },
  });

  if (!sello) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nucleosur.cl";
  const certificadoUrl = `${appUrl}/sello/${id}`;
  const qrDataUrl = await QRCode.toDataURL(certificadoUrl, {
    width: 120,
    margin: 1,
    color: { dark: "#0B1B33", light: "#FFFFFF" },
  });

  const nivel = (sello.nivel as NivelKey) in NIVEL_CONFIG ? (sello.nivel as NivelKey) : "inicial";
  const config = NIVEL_CONFIG[nivel];

  const [year, month] = sello.periodo.split("-").map(Number);
  const periodoLabel = new Date(year, month - 1, 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const fechaEmision = sello.emitido_at.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header marca */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#0B1B33] flex items-center justify-center">
            <IconShieldCheck size={20} className="text-[#2F6B2A]" />
          </div>
          <span className="text-lg font-bold text-[#0B1B33]">Nucleo 24H</span>
        </div>

        {/* Certificado */}
        <div className={`bg-white rounded-2xl border-2 ${config.border} shadow-lg overflow-hidden`}>
          {/* Encabezado nivel */}
          <div className={`${config.bg} px-6 py-5 text-center border-b ${config.border}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconMedal size={28} className={config.color} />
              <span className={`text-2xl font-bold ${config.color}`}>
                Sello {config.label}
              </span>
            </div>
            <p className="text-4xl font-bold text-[#0B1B33] mt-1">
              {Math.round(sello.score_general)}%
            </p>
            <p className="text-sm text-[#5B6980] mt-1 capitalize">{periodoLabel}</p>
          </div>

          {/* Datos del local */}
          <div className="px-6 py-5 space-y-3">
            <div className="text-center border-b border-[#F1F5F9] pb-4">
              <p className="font-bold text-[#0B1B33] text-lg">{sello.tenant.nombre}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-[#5B6980]">
                <IconMapPin size={14} />
                <span>{sello.tenant.ciudad}</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">RUT {sello.tenant.rut}</p>
            </div>

            {/* Dimensiones */}
            <div className="space-y-2 py-2">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
                Resultado por dimensión
              </p>
              {[
                { label: "Documentación y registros", score: sello.score_documentacion },
                { label: "Condiciones sanitarias", score: sello.score_condiciones },
                { label: "Capacitaciones", score: sello.score_capacitaciones },
                { label: "Tareas completadas", score: sello.score_tareas },
              ].map((dim) => (
                <div key={dim.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#5B6980]">{dim.label}</span>
                  <span className={`font-semibold ${
                    dim.score >= 80 ? "text-[#2F6B2A]" : dim.score >= 60 ? "text-[#D97706]" : "text-[#B42318]"
                  }`}>
                    {Math.round(dim.score)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Fecha emisión */}
            <div className="border-t border-[#F1F5F9] pt-4">
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <IconCalendar size={13} />
                <span>Emitido el {fechaEmision}</span>
              </div>
            </div>

            {/* Descargos */}
            {sello.descargos_habilitados && (
              <div className="bg-[#E5F1E3] rounded-xl p-3 flex items-start gap-2">
                <IconCircleCheck size={16} className="text-[#2F6B2A] shrink-0 mt-0.5" />
                <p className="text-xs text-[#255620]">
                  <span className="font-semibold">Descargos habilitados</span> — este local tiene
                  derecho a descargos gratuitos ante la autoridad sanitaria.
                </p>
              </div>
            )}
          </div>

          {/* Footer con QR */}
          <div className="bg-[#F8FAFC] px-6 py-4 border-t border-[#DDE3EA] flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR verificación" width={60} height={60} className="rounded shrink-0" />
            <div>
              <p className="text-xs text-[#5B6980] font-medium">Verificar autenticidad</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5 break-all">{certificadoUrl}</p>
              <p className="text-[10px] text-[#94A3B8] mt-1">
                Certificado emitido por Nucleo 24H SpA ·{" "}
                <span className="font-mono">{id.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-4">
          Escanea el QR o visita{" "}
          <span className="font-medium text-[#5B6980] break-all">{certificadoUrl}</span>
        </p>
      </div>
    </div>
  );
}
