import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import QRCode from "qrcode";
import { IconMedal, IconMapPin, IconCalendar } from "@tabler/icons-react";
import { getAppUrl } from "@/lib/branding";
import { BrandLogo } from "@/components/BrandLogo";
import { selloPublicoVisible } from "@/lib/payments/mora";
import { LEYENDA_ALCANCE_SELLO } from "@/lib/declaraciones/textos";
import { COMPONENTES_SEGUIMIENTO, COMPONENTES_VISITA } from "@/lib/sellos/v2";

const NIVEL_CONFIG = {
  inicial: {
    label: "Inicial",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  intermedio: {
    label: "Intermedio",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  avanzado: {
    label: "Avanzado",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  premium: {
    label: "Premium",
    color: "text-[#2F6B2A]",
    bg: "bg-[#E5F1E3]",
    border: "border-green-200",
  },
  sin_sello: {
    label: "Sin sello",
    color: "text-[#5B6980]",
    bg: "bg-[#EEF1F4]",
    border: "border-[#DDE3EA]",
  },
  bronce: {
    label: "Bronce",
    color: "text-[#7A5000]",
    bg: "bg-[#FCF0D0]",
    border: "border-[#C17A2B]",
  },
  plata: {
    label: "Plata",
    color: "text-[#334155]",
    bg: "bg-[#EEF1F4]",
    border: "border-[#64748B]",
  },
  oro: {
    label: "Oro",
    color: "text-[#7A5000]",
    bg: "bg-[#F8E8C4]",
    border: "border-[#E3B341]",
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
        select: {
          nombre: true,
          ciudad: true,
          rut: true,
          plan: true,
          suscripcion: { select: { estado: true, acceso_hasta: true } },
        },
      },
    },
  });

  if (!sello || sello.estado !== "emitido") notFound();

  const suscripcion = sello.tenant.suscripcion;
  if (
    suscripcion &&
    !selloPublicoVisible({ estado: suscripcion.estado, accesoHasta: suscripcion.acceso_hasta })
  ) {
    return (
      <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl border border-[#DDE3EA] p-8 text-center space-y-3">
          <BrandLogo className="w-44 mx-auto" priority />
          <h1 className="text-xl font-bold text-[#0B1B33]">Sello sin vigencia pública</h1>
          <p className="text-sm text-[#5B6980]">
            La suscripción de este local está suspendida o cancelada. El certificado no se exhibe mientras el servicio no esté al día.
          </p>
        </div>
      </div>
    );
  }

  const appUrl = getAppUrl();
  const certificadoUrl = `${appUrl}/sello/${id}`;
  const qrDataUrl = await QRCode.toDataURL(certificadoUrl, {
    width: 120,
    margin: 1,
    color: { dark: "#0B1B33", light: "#FFFFFF" },
  });

  const nivel = (sello.nivel as NivelKey) in NIVEL_CONFIG ? (sello.nivel as NivelKey) : "sin_sello";
  const config = NIVEL_CONFIG[nivel];
  const esV2 = sello.esquema === "v2";
  const componentes = (sello.scores_componentes ?? {}) as Record<string, number>;

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

  const filas = esV2
    ? [...COMPONENTES_SEGUIMIENTO, ...COMPONENTES_VISITA].map((c) => ({
        label: c.etiqueta,
        score: ((componentes[c.id] ?? 0) / c.puntos) * 100,
      }))
    : [
        { label: "Documentación y registros", score: sello.score_documentacion },
        { label: "Condiciones sanitarias", score: sello.score_condiciones },
        { label: "Capacitaciones", score: sello.score_capacitaciones },
        { label: "Tareas completadas", score: sello.score_tareas },
      ];

  return (
    <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <BrandLogo className="w-44" priority />
        </div>

        <div className={`bg-white rounded-2xl border-2 ${config.border} shadow-lg overflow-hidden`}>
          <div className={`${config.bg} px-6 py-5 text-center border-b ${config.border}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconMedal size={28} className={config.color} />
              <span className={`text-2xl font-bold ${config.color}`}>Sello {config.label}</span>
            </div>
            <p className="text-4xl font-bold text-[#0B1B33] mt-1">{Math.round(sello.score_general)}%</p>
            <p className="text-sm text-[#5B6980] mt-1 capitalize">{periodoLabel}</p>
          </div>

          <div className="px-6 py-5 space-y-3">
            <div className="text-center border-b border-[#F1F5F9] pb-4">
              <p className="font-bold text-[#0B1B33] text-lg">{sello.tenant.nombre}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-[#5B6980]">
                <IconMapPin size={14} />
                <span>{sello.tenant.ciudad}</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">RUT {sello.tenant.rut}</p>
            </div>

            <div className="space-y-2 py-2">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
                Resultado por dimensión
              </p>
              {filas.map((dim) => (
                <div key={dim.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#5B6980]">{dim.label}</span>
                  <span
                    className={`font-semibold ${
                      dim.score >= 80 ? "text-[#2F6B2A]" : dim.score >= 60 ? "text-[#D97706]" : "text-[#B42318]"
                    }`}
                  >
                    {Math.round(dim.score)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F1F5F9] pt-4">
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <IconCalendar size={13} />
                <span>Emitido el {fechaEmision}</span>
              </div>
              <p className="text-[11px] text-[#5B6980] mt-3 leading-relaxed">{LEYENDA_ALCANCE_SELLO}</p>
            </div>
          </div>

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
          Escanea el QR o visita <span className="font-medium text-[#5B6980] break-all">{certificadoUrl}</span>
        </p>
      </div>
    </div>
  );
}
