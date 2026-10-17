import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, APP_LEGAL_NAME, APP_TAGLINE } from "@/lib/branding";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: `${APP_NAME} — Cumplimiento normativo sin complicaciones`,
  description:
    "Nucleo 24H centraliza los requisitos sanitarios, ambientales y laborales de tu pyme. Registros BPM, documentos, alertas y sellos de cumplimiento — empezando por el rubro alimenticio.",
};

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 mt-0.5" aria-hidden>
      <circle cx="7.5" cy="7.5" r="7" stroke="#2F6B2A" strokeWidth="1.2" />
      <path
        d="M4.5 7.5l2 2 4-4"
        stroke="#2F6B2A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  {
    titulo: "Semáforo de cumplimiento",
    desc: "Visualiza en tiempo real si tu negocio está en verde, amarillo o rojo. Saber tu estado normativo nunca fue tan claro.",
    color: "navy" as const,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="#0B1B33" strokeWidth="1.8" />
        <path d="M12 7v5.5l3.5 2" stroke="#0B1B33" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titulo: "Gestión de documentos",
    desc: "Sube, almacena y gestiona todos tus certificados y registros desde un solo lugar. Con fechas de vencimiento y recordatorios automáticos.",
    color: "green" as const,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden>
        <path d="M5 12l4 4L19 8" stroke="#2F6B2A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    titulo: "Alertas inteligentes",
    desc: "Recibe notificaciones antes de que venzan tus documentos clave. Sin sorpresas ni multas por descuido.",
    color: "yellow" as const,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 4a6 6 0 0 1 6 6c0 4.5 2 6 2 6H4s2-1.5 2-6a6 6 0 0 1 6-6z"
          stroke="#F39C12"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M10 18a2 2 0 0 0 4 0" stroke="#F39C12" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titulo: "Registros y plantillas",
    desc: "Checklists BPM, manuales HACCP, registros de temperatura y más — listos para usar y actualizados según tu rubro.",
    color: "navy" as const,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#0B1B33" strokeWidth="1.8" />
        <path d="M7 10h10M7 14h6" stroke="#0B1B33" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titulo: "Red de asesores",
    desc: "Conéctate con especialistas que revisan tu situación y te acompañan en el proceso de regularización.",
    color: "green" as const,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden>
        <circle cx="9" cy="7" r="4" stroke="#2F6B2A" strokeWidth="1.8" />
        <path d="M3 20c0-3.314 2.686-6 6-6" stroke="#2F6B2A" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="17" cy="15" r="4" stroke="#2F6B2A" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    titulo: "Sellos y auditoría lista",
    desc: "Obtén un sello verificable y genera reportes en un clic para inspecciones de SEREMI o auditorías internas.",
    color: "yellow" as const,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 3L3 8v4c0 5.25 3.9 10.14 9 11.35C17.1 22.14 21 17.25 21 12V8L12 3z"
          stroke="#F39C12"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const ICON_BG = {
  navy: "bg-[rgba(11,37,69,0.1)]",
  green: "bg-[rgba(46,204,113,0.12)]",
  yellow: "bg-[rgba(243,156,18,0.12)]",
};

const PLAN_CALIDAD = [
  "BPM (Buenas Prácticas de Manufactura)",
  "Gestión de documentos",
  "Capacitaciones",
  "Sellos de cumplimiento",
];

const PLAN_INTEGRAL = [
  "Todo lo del Plan Calidad",
  "Gestión ambiental",
  "Ventanilla Única",
  "Reportes de auditoría",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1B33] font-sans text-[15px] leading-relaxed">
      {/* NAV */}
      <header className="sticky top-0 z-50 h-16 px-4 sm:px-8 lg:px-12 flex items-center gap-6 sm:gap-10 bg-white/95 backdrop-blur border-b border-[#E1E8EF]">
        <Link href="/" className="flex items-center gap-2.5 mr-auto no-underline">
          <BrandLogo variant="mark" className="w-10 h-10" priority />
          <span className="text-lg font-bold text-[#0B1B33] tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 list-none">
          <a href="#funciones" className="text-sm font-medium text-[#7F8C8D] hover:text-[#0B1B33] transition-colors">
            Funciones
          </a>
          <a href="#como-funciona" className="text-sm font-medium text-[#7F8C8D] hover:text-[#0B1B33] transition-colors">
            Cómo funciona
          </a>
          <a href="#precios" className="text-sm font-medium text-[#7F8C8D] hover:text-[#0B1B33] transition-colors">
            Precios
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-[9px] text-sm font-semibold text-[#0B1B33] border-[1.5px] border-[#E1E8EF] hover:border-[#0B1B33] hover:bg-[rgba(11,37,69,0.04)] transition-all"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-5 py-2.5 rounded-[9px] text-sm font-semibold text-white bg-[#0B1B33] shadow-[0_2px_8px_rgba(11,37,69,0.25)] hover:bg-[#081C33] transition-all"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B1B33] px-4 sm:px-8 lg:px-12 pt-20 sm:pt-24 pb-28 sm:pb-32 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(26,53,89,0.45) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(46,204,113,0.08) 0%, transparent 40%)",
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/85 text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full mb-7 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B2A]" />
            Plataforma regulatoria para pymes chilenas
          </span>
          <h1 className="text-[clamp(2.25rem,5vw,3.625rem)] font-extrabold text-white leading-[1.1] tracking-[-1.5px] max-w-[760px] mx-auto mb-5">
            Cumplimiento normativo <em className="not-italic text-[#2F6B2A]">sin complicaciones</em>
          </h1>
          <p className="text-lg text-white/65 max-w-[540px] mx-auto mb-10 leading-relaxed">
            {APP_NAME} centraliza los requisitos sanitarios, ambientales y laborales de tu pyme en un
            solo lugar — desde alimentos hasta medio ambiente. Siempre al día con MINSAL, SMA, SEREMI
            y más.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="inline-flex items-center px-7 py-3.5 rounded-[11px] text-[15px] font-semibold bg-white text-[#0B1B33] shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all"
            >
              Crear cuenta
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center px-7 py-3.5 rounded-[11px] text-[15px] font-semibold text-white border-[1.5px] border-white/40 hover:bg-white/10 hover:border-white/70 transition-all"
            >
              Ver cómo funciona
            </a>
          </div>
          <div className="mt-14 flex items-center justify-center gap-2.5 text-[12.5px] font-medium tracking-wide text-white/40">
            <span className="hidden sm:block w-[60px] h-px bg-white/15" />
            Hoy enfocado en el rubro alimenticio · Módulos para cualquier industria regulada
            <span className="hidden sm:block w-[60px] h-px bg-white/15" />
          </div>
        </div>
      </section>

      {/* APP PREVIEW */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-8 -mt-12 sm:-mt-[50px] mb-16 sm:mb-20">
        <div className="bg-[#F4F6F3] rounded-2xl border border-[#E1E8EF] shadow-[0_24px_80px_rgba(11,37,69,0.18),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="bg-[#f0f2f5] border-b border-[#E1E8EF] px-4 py-2.5 flex items-center gap-2">
            <span className="w-[11px] h-[11px] rounded-full bg-[#E74C3C]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#F39C12]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#2F6B2A]" />
            <div className="flex-1 bg-white border border-[#E1E8EF] rounded-md px-3 py-1 text-[11.5px] text-[#7F8C8D] text-center font-mono">
              app.nucleo24h.cl/dashboard
            </div>
          </div>
          <div className="flex h-[280px] sm:h-[360px]">
            <aside className="hidden sm:block w-[180px] shrink-0 bg-[#0B1B33] py-4">
              <div className="px-3.5 pb-3.5 border-b border-white/[0.08] mb-2">
                <div className="flex items-center gap-2">
                  <BrandLogo variant="mark" className="w-6 h-6 rounded-md" />
                  <span className="text-[13px] font-bold text-white">{APP_NAME}</span>
                </div>
                <p className="text-[9px] text-white/40 mt-1 pl-8">{APP_TAGLINE}</p>
              </div>
              {[
                { label: "Dashboard", active: true },
                { label: "Mis Documentos", active: false },
                { label: "Registros", active: false },
                { label: "Alertas", active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-3.5 py-2 text-[11px] font-medium border-l-2 ${
                    item.active
                      ? "bg-white/[0.08] text-white border-[#2F6B2A]"
                      : "text-white/55 border-transparent"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-[3px] shrink-0 ${
                      item.active ? "bg-white/60" : "bg-white/15"
                    }`}
                  />
                  {item.label}
                </div>
              ))}
            </aside>
            <div className="flex-1 overflow-hidden bg-[#F4F6F3] p-4 sm:p-5 flex flex-col gap-3">
              <div className="bg-white rounded-lg border border-[#E1E8EF] h-[38px] flex items-center px-4 gap-3">
                <span className="text-xs font-semibold text-[#0B1B33] flex-1">
                  Mi Panel de Cumplimiento
                </span>
                <span className="w-[22px] h-[22px] bg-[#F4F6F3] rounded border border-[#E1E8EF]" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { val: "13", lbl: "Total requeridos", color: "text-[#0B1B33]" },
                  { val: "8", lbl: "Al día", color: "text-[#2F6B2A]" },
                  { val: "4", lbl: "Por vencer", color: "text-[#F39C12]" },
                  { val: "1", lbl: "Críticos", color: "text-[#E74C3C]" },
                ].map((c) => (
                  <div
                    key={c.lbl}
                    className="bg-white rounded-lg border border-[#E1E8EF] px-3 py-2.5"
                  >
                    <div className={`text-xl font-bold ${c.color}`}>{c.val}</div>
                    <div className="text-[9px] text-[#7F8C8D] mt-0.5">{c.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg border border-[#E1E8EF] p-3 sm:p-4 flex items-center gap-3.5 flex-1">
                <div className="bg-[#1a1a1a] rounded-lg p-1.5 flex flex-col gap-1.5 shrink-0">
                  <span className="w-[18px] h-[18px] rounded-full bg-[#3a1717]" />
                  <span className="w-[18px] h-[18px] rounded-full bg-[#F39C12] shadow-[0_0_8px_rgba(243,156,18,0.5)]" />
                  <span className="w-[18px] h-[18px] rounded-full bg-[#1e4d2a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-[#7F8C8D] uppercase tracking-wide">
                    Nivel de cumplimiento
                  </p>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 bg-[rgba(243,156,18,0.12)] text-[#d4890a] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      AMARILLO — Con observaciones
                    </span>
                  </div>
                  <div className="h-1 bg-[#F4F6F3] rounded-full mt-2.5 overflow-hidden">
                    <div className="h-full w-[62%] bg-[#0B1B33] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGOS */}
      <div className="px-4 sm:px-8 py-12 text-center border-b border-[#E1E8EF]">
        <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#7F8C8D] mb-7">
          Integrado con organismos regulatorios
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {["MINSAL", "SMA", "SEREMI Salud", "SII", "INN"].map((org) => (
            <div
              key={org}
              className="flex items-center gap-2 text-sm font-bold text-[#BDC3C7] tracking-wide"
            >
              <span className="w-5 h-5 bg-[#E8ECEF] rounded" />
              {org}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="funciones" className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[1.5px] text-[#0B1B33] mb-3">
          Funciones principales
        </p>
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold tracking-tight leading-[1.15] text-[#0B1B33] mb-4">
          Todo lo que tu pyme necesita
          <br className="hidden sm:block" /> para estar en regla
        </h2>
        <p className="text-[17px] text-[#7F8C8D] max-w-[520px] leading-relaxed">
          Sea tu rubro alimentos, medio ambiente u otro — {APP_NAME} organiza, recuerda y facilita
          cada paso normativo.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {FEATURES.map((f) => (
            <div
              key={f.titulo}
              className="bg-[#F4F6F3] rounded-2xl border border-[#E1E8EF] p-7 hover:shadow-[0_8px_32px_rgba(11,37,69,0.1)] hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-[13px] flex items-center justify-center mb-5 ${ICON_BG[f.color]}`}
              >
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-[#0B1B33] mb-2.5 tracking-tight">
                {f.titulo}
              </h3>
              <p className="text-sm text-[#7F8C8D] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="como-funciona"
        className="bg-[#F4F6F3] border-y border-[#E1E8EF] px-4 sm:px-8 py-16 sm:py-20"
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[1.5px] text-[#0B1B33] mb-3">
              Proceso simple
            </p>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold tracking-tight text-[#0B1B33] mb-4">
              En 3 pasos, en regla
            </h2>
            <p className="text-[17px] text-[#7F8C8D] max-w-[520px] mx-auto">
              Sin tecnicismos. Sin burocracia innecesaria.
            </p>
          </div>
          <div className="relative grid sm:grid-cols-3 gap-8 mt-14">
            <div
              className="hidden sm:block absolute top-7 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-0.5 opacity-30"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #0B1B33 0, #0B1B33 8px, transparent 8px, transparent 16px)",
              }}
            />
            {[
              {
                n: "1",
                title: "Registra tu negocio",
                desc: `Crea tu cuenta, indica tu rubro (alimentos, medio ambiente u otro) y tu región. ${APP_NAME} identifica automáticamente los requisitos que te aplican.`,
              },
              {
                n: "2",
                title: "Sube tus documentos",
                desc: `Carga los certificados y permisos que ya tienes. ${APP_NAME} detecta los que faltan y te guía para obtenerlos, con plantillas y acompañamiento.`,
              },
              {
                n: "3",
                title: "Mantente al día",
                desc: `Recibe alertas antes de cada vencimiento. Tu semáforo siempre en verde. Tú te enfocas en tu negocio — ${APP_NAME} vigila el cumplimiento.`,
              },
            ].map((s) => (
              <div key={s.n} className="text-center px-4 relative z-[1]">
                <div className="w-14 h-14 bg-[#0B1B33] text-white text-lg font-extrabold rounded-full flex items-center justify-center mx-auto mb-5">
                  {s.n}
                </div>
                <h3 className="text-base font-bold text-[#0B1B33] mb-2.5">{s.title}</h3>
                <p className="text-sm text-[#7F8C8D] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[1.5px] text-[#0B1B33] mb-3">Planes</p>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold tracking-tight text-[#0B1B33] mb-4">
            Elige tu plan
          </h2>
          <p className="text-[17px] text-[#7F8C8D] max-w-[520px] mx-auto">
            Sin contratos. Sin letra chica. Cancela cuando quieras.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 max-w-[760px] mx-auto gap-6 mt-14 items-start">
          <div className="bg-white rounded-[18px] border border-[#E1E8EF] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(11,37,69,0.1)] transition-shadow">
            <p className="text-xs font-bold uppercase tracking-[1.5px] text-[#7F8C8D] mb-3">
              Plan Calidad
            </p>
            <p className="text-[42px] font-extrabold text-[#0B1B33] tracking-[-2px] leading-none">
              <sup className="text-lg font-semibold tracking-normal align-top">$</sup>
              80.000
            </p>
            <p className="text-[13px] text-[#7F8C8D] mt-1 mb-6">CLP / mes</p>
            <div className="h-px bg-[#E1E8EF] my-6" />
            {PLAN_CALIDAD.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-[13.5px] text-[#0B1B33] mb-3">
                <CheckIcon />
                {f}
              </div>
            ))}
            <Link
              href="/register"
              className="mt-7 w-full inline-flex items-center justify-center px-7 py-3.5 rounded-[11px] text-[15px] font-semibold text-[#0B1B33] border-[1.5px] border-[#E1E8EF] hover:border-[#0B1B33] hover:bg-[rgba(11,37,69,0.04)] transition-all"
            >
              Elegir plan
            </Link>
          </div>

          <div className="relative bg-white rounded-[18px] border border-[#0B1B33] p-8 shadow-[0_4px_24px_rgba(11,37,69,0.15)]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0B1B33] text-white text-[11px] font-bold px-3.5 py-1 rounded-full tracking-wide whitespace-nowrap">
              Más completo
            </span>
            <p className="text-xs font-bold uppercase tracking-[1.5px] text-[#7F8C8D] mb-3">
              Plan Integral
            </p>
            <p className="text-[42px] font-extrabold text-[#0B1B33] tracking-[-2px] leading-none">
              <sup className="text-lg font-semibold tracking-normal align-top">$</sup>
              150.000
            </p>
            <p className="text-[13px] text-[#7F8C8D] mt-1 mb-6">CLP / mes</p>
            <div className="h-px bg-[#E1E8EF] my-6" />
            {PLAN_INTEGRAL.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-[13.5px] text-[#0B1B33] mb-3">
                <CheckIcon />
                {f}
              </div>
            ))}
            <Link
              href="/register"
              className="mt-7 w-full inline-flex items-center justify-center px-7 py-3.5 rounded-[11px] text-[15px] font-semibold text-white bg-[#0B1B33] shadow-[0_2px_8px_rgba(11,37,69,0.25)] hover:bg-[#081C33] transition-all"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 text-center">
        <div className="max-w-[640px] mx-auto">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.375rem)] font-extrabold text-[#0B1B33] tracking-tight leading-[1.15] mb-4">
            ¿Listo para estar siempre en regla?
          </h2>
          <p className="text-[17px] text-[#7F8C8D] leading-relaxed mb-9">
            Gestiona el cumplimiento normativo de tu pyme con {APP_NAME}.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-[440px] mx-auto">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-[11px] text-[15px] font-semibold text-white bg-[#0B1B33] shadow-[0_2px_8px_rgba(11,37,69,0.25)] hover:bg-[#081C33] transition-all flex-1"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-[11px] text-[15px] font-semibold text-[#0B1B33] border-[1.5px] border-[#E1E8EF] hover:border-[#0B1B33] transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0B1B33] text-white/60 px-4 sm:px-8 py-12">
        <div className="max-w-[1100px] mx-auto grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 pb-10 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-3 text-base font-bold text-white mb-3">
              <BrandLogo variant="mark" className="w-12 h-12 rounded-lg" />
              <div>
                <p>{APP_NAME}</p>
                <p className="text-[11px] font-medium text-white/45 normal-case tracking-normal">
                  {APP_TAGLINE}
                </p>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-white/45 max-w-[220px] mt-1">
              Cumplimiento normativo para pymes chilenas de todos los rubros — alimentos, medio
              ambiente y más.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/40 mb-4">Producto</p>
            <a href="#funciones" className="block text-[13.5px] text-white/60 hover:text-white mb-2.5 transition-colors">
              Funciones
            </a>
            <a href="#precios" className="block text-[13.5px] text-white/60 hover:text-white mb-2.5 transition-colors">
              Precios
            </a>
            <Link href="/login" className="block text-[13.5px] text-white/60 hover:text-white mb-2.5 transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="block text-[13.5px] text-white/60 hover:text-white mb-2.5 transition-colors">
              Crear cuenta
            </Link>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/40 mb-4">Empresa</p>
            <a
              href="mailto:contacto@nucleosur.cl"
              className="block text-[13.5px] text-white/60 hover:text-white mb-2.5 transition-colors"
            >
              Contacto
            </a>
            <span className="block text-[13.5px] text-white/40 mb-2.5">Osorno, Chile</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/40 mb-4">Legal</p>
            <Link
              href="/politica-de-privacidad"
              className="block text-[13.5px] text-white/60 hover:text-white mb-2.5 transition-colors"
            >
              Privacidad
            </Link>
          </div>
        </div>
        <div className="max-w-[1100px] mx-auto pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px]">
          <span>
            © {new Date().getFullYear()} {APP_LEGAL_NAME} · Osorno, Chile · Todos los derechos
            reservados
          </span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full text-[11.5px] text-white/50">
              SSL seguro
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full text-[11.5px] text-white/50">
              Ley 21.719
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
