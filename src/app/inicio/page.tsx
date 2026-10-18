import type { Metadata } from "next";
import Link from "next/link";
import { APP_LEGAL_NAME, APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { PLAN_PRECIOS_CLP } from "@/lib/payments/flow";
import { formatCLP } from "@/lib/utils";
import { DiagnosticoForm } from "./DiagnosticoForm";

export const metadata: Metadata = {
  title: `${APP_NAME} — Cumplimiento sanitario para locales de Osorno`,
  description:
    "Implementamos buenas prácticas sanitarias, capacitamos al equipo y acompañamos cada mes con una visita presencial y una plataforma de registros, documentos y sello.",
};

const EXIGEN = [
  { t: "Temperaturas diarias", d: "El registro de cada cámara, de cada día." },
  { t: "Limpieza y sanitización", d: "Qué se limpió, con qué y quién lo verificó." },
  { t: "Control de plagas", d: "Certificados de fumigación vigentes." },
  { t: "Capacitaciones", d: "Listas de asistencia del personal." },
];

const SERVICIOS = [
  {
    titulo: "Implementación BPM",
    color: "#2F6B2A",
    items: [
      "Diagnóstico inicial de tu local",
      "Implementación de Buenas Prácticas de Manufactura",
      "Procedimientos y registros esenciales",
      "Orden y control sanitario",
    ],
  },
  {
    titulo: "Capacitaciones",
    color: "#0E6E7E",
    items: [
      "Capacitación inicial al equipo",
      "Capacitaciones mensuales",
      "Temas prácticos y aplicables",
      "Material de apoyo y registro de asistencia",
    ],
  },
  {
    titulo: "Plataforma documental",
    color: "#0B1B33",
    items: [
      "Respaldo digital de todos los documentos",
      "Acceso fácil y seguro desde el celular",
      "Carpetas organizadas por mes",
      "Documentación lista para fiscalizaciones",
    ],
  },
  {
    titulo: "Seguimiento mensual",
    color: "#8A5A00",
    items: [
      "Visita presencial en radio urbano",
      "Revisión de registros y procesos",
      "Informe mensual y plan de mejoras",
      "Evaluación y entrega del sello",
    ],
  },
];

const PASOS = [
  { n: "1", cuando: "Al inicio", titulo: "Diagnóstico y puesta en marcha", texto: "Visitamos tu local, revisamos cómo está hoy y dejamos configurados tus equipos, áreas y registros." },
  { n: "2", cuando: "Cada día", titulo: "Tu equipo registra en el celular", texto: "Una guía del día muestra qué falta: temperaturas, limpieza, residuos. Todo en pocos toques." },
  { n: "3", cuando: "Cada mes", titulo: "Visita y capacitación", texto: "Tu asesor revisa registros y documentos, capacita al equipo y deja un plan de mejoras con plazos." },
  { n: "4", cuando: "Fin de mes", titulo: "Sello e informe", texto: "Calculamos tu sello, generamos el informe y te avisamos por correo. Empieza un nuevo ciclo." },
];

const SELLOS = [
  { nivel: "Inicial", rango: "Menos de 60%", texto: "Cumplimiento bajo. Hay brechas importantes por mejorar.", bg: "#B42318", fg: "#FFFFFF" },
  { nivel: "Intermedio", rango: "60% a 74%", texto: "Vas avanzando, pero aún hay aspectos por trabajar.", bg: "#E8B100", fg: "#0B1B33" },
  { nivel: "Avanzado", rango: "75% a 89%", texto: "Buen cumplimiento. Tus procesos y registros están en orden.", bg: "#2F6B2A", fg: "#FFFFFF" },
  { nivel: "Premium", rango: "90% o más", texto: "Cumplimiento sobresaliente. Tu local es un referente.", bg: "#0B1B33", fg: "#E3B341" },
];

const PLATAFORMA = [
  { t: "Guía del día", d: "Cada turno ve en una pantalla qué falta registrar y por qué importa." },
  { t: "Registros desde el celular", d: "Temperaturas, limpieza, plagas y recepción de mercadería, con acción correctiva cuando algo sale de rango." },
  { t: "Documentos con vencimiento", d: "Permisos y certificados ordenados por mes, con revisión de tu asesor." },
  { t: "Sello mensual en PDF", d: "Un certificado con enlace público para que clientes e inspectores lo verifiquen." },
];

const PLANES = [
  {
    nombre: "Plan Calidad",
    etiqueta: "Para partir",
    precio: PLAN_PRECIOS_CLP.calidad,
    fondo: "#FFFFFF",
    texto: "#0B1B33",
    borde: "#DDE3EA",
    chipBg: "#E5F1E3",
    chipFg: "#255620",
    linea: "#DDE3EA",
    tick: "#2F6B2A",
    btnBg: "#0B1B33",
    btnFg: "#FFFFFF",
    cta: "Quiero el Plan Calidad",
    items: [
      "1 visita presencial mensual en radio urbano",
      "Revisión de registros y documentación",
      "Capacitación mensual para el equipo",
      "Plataforma documental actualizada",
      "Informe mensual de cumplimiento",
      "Plan de mejoras personalizado",
      "Evaluación y entrega de sello mensual",
      "Orientación técnica permanente",
      "Apoyo ante fiscalizaciones",
      "Descargos gratuitos con sello Premium",
    ],
  },
  {
    nombre: "Plan Integral",
    etiqueta: "Calidad + medio ambiente",
    precio: PLAN_PRECIOS_CLP.integral,
    fondo: "#0B1B33",
    texto: "#FFFFFF",
    borde: "#0B1B33",
    chipBg: "#E3B341",
    chipFg: "#0B1B33",
    linea: "#2A4068",
    tick: "#E3B341",
    btnBg: "#E3B341",
    btnFg: "#0B1B33",
    cta: "Quiero el Plan Integral",
    items: [
      "Todo lo del Plan Calidad",
      "Apoyo en segregación de residuos: ordinarios, reciclables y peligrosos",
      "Declaraciones en Ventanilla Única, hasta 12 al año",
      "Charlas ambientales para el equipo",
      "Asesoría en cumplimiento ambiental",
      "Seguimiento y recordatorios de vencimientos",
    ],
  },
];

const ADICIONALES = [
  "Resolución sanitaria e inicio de actividades",
  "Elaboración de HACCP y manuales",
  "Etiquetado y rotulado nutricional",
  "Proyectos sanitarios y regularizaciones",
  "Defensa en sumarios graves",
];

const FAQ = [
  { p: "¿Qué zona cubren?", r: "La visita presencial mensual cubre el radio urbano de Osorno. Si tu local está fuera, escríbenos y vemos cómo atenderte." },
  { p: "¿Cuánto dura el contrato?", r: "El servicio es anual: 12 meses, con pago mensual. Incluye todo el año de soporte, capacitación y seguimiento." },
  { p: "¿Necesito saber de computación?", r: "No. La plataforma está pensada para usarse desde el celular, en la cocina, con pocos toques. Tu asesor te acompaña al comenzar." },
  { p: "¿Qué pasa si el sello baja de nivel?", r: "Cada informe trae un plan de mejoras con lo que falta para subir. Si crees que hay un error en tu sello, puedes pedir una revisión." },
  { p: "¿Qué servicios no están incluidos?", r: "La resolución sanitaria e inicio de actividades, la elaboración de HACCP y manuales, el etiquetado nutricional, los proyectos sanitarios y la defensa en sumarios graves se cotizan aparte." },
  { p: "¿Cómo protegen los datos de mi local?", r: "Tratamos los datos personales conforme a la Ley 21.719. Puedes ejercer tus derechos de acceso, rectificación y supresión desde tu cuenta." },
];

function Escudo({ className = "w-9 h-9", dorado = false }: { className?: string; dorado?: boolean }) {
  return (
    <span className={`${className} rounded-[11px] flex items-center justify-center shrink-0 ${dorado ? "bg-[#E3B341] text-[#0B1B33]" : "bg-[#0B1B33] text-[#E3B341]"}`} aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" />
      </svg>
    </span>
  );
}

function Boton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const clases = `inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-xl font-extrabold border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341] ${className}`;
  if (href.startsWith("/")) {
    return <Link href={href} className={clases}>{children}</Link>;
  }
  return <a href={href} className={clases}>{children}</a>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1B33] scroll-smooth">
      <header className="sticky top-0 z-20 bg-white/95 border-b border-[#DDE3EA]">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 min-h-[72px] flex flex-wrap items-center gap-2 sm:gap-7">
          <a href="#inicio" className="flex items-center gap-2.5 mr-auto text-[#0B1B33]">
            <Escudo />
            <span className="text-xl font-extrabold tracking-tight">{APP_NAME}</span>
          </a>
          <nav aria-label="Secciones" className="hidden lg:flex flex-wrap gap-x-6">
            {[
              ["#servicios", "Servicios"],
              ["#proceso", "Cómo funciona"],
              ["#sellos", "Sellos"],
              ["#planes", "Planes"],
              ["#preguntas", "Preguntas"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="py-3 text-[15px] font-bold text-[#41506A] hover:text-[#0B1B33]">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="inline-flex items-center min-h-11 px-4 rounded-[10px] text-sm font-extrabold border-2 border-[#C3CCD8] text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]">
              Iniciar sesión
            </Link>
            <a href="#contacto" className="inline-flex items-center min-h-11 px-4 rounded-[10px] text-sm font-extrabold bg-[#2F6B2A] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3B341]">
              Agenda tu diagnóstico
            </a>
          </div>
        </div>
      </header>

      <section id="inicio" className="bg-[#0B1B33] text-white">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-16 sm:py-20 flex flex-wrap items-center gap-12">
          <div className="flex-1 basis-[480px] flex flex-col gap-6">
            <span className="self-start inline-flex items-center h-7 px-3 rounded-full text-[13px] font-bold bg-[#16294A] text-[#E3B341] border border-[#2A4068]">
              Restaurantes, cafeterías y food trucks de Osorno
            </span>
            <h1 className="text-[clamp(2.4rem,5vw,3.5rem)] font-extrabold leading-[1.04] tracking-tight">
              Tu local en regla,<br />todos los días del año.
            </h1>
            <p className="max-w-[560px] text-[19px] font-medium leading-relaxed text-[#C9D3E3]">
              Implementamos las buenas prácticas sanitarias, capacitamos a tu equipo y te acompañamos cada mes con una visita presencial y una plataforma donde todo queda respaldado.
            </p>
            <div className="flex flex-wrap gap-3">
              <Boton href="#contacto" className="bg-[#E3B341] text-[#0B1B33]">Agenda tu diagnóstico</Boton>
              <Boton href="#contacto" className="bg-transparent text-white border-[#8FA2C0]">Escríbenos por WhatsApp</Boton>
            </div>
            <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[#C9D3E3]">
              {["Visita mensual presencial", "Documentos listos para fiscalización", "Sello mensual verificable"].map((item) => (
                <li key={item} className="flex items-center gap-2"><span className="text-[#E3B341]">✓</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1 basis-[380px] flex justify-center">
            <div className="w-full max-w-[440px] flex flex-col gap-4">
              <div className="bg-white text-[#0B1B33] rounded-[18px] p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <p className="font-extrabold">Sello de ejemplo</p>
                  <span className="inline-flex h-7 items-center px-3 rounded-full text-[13px] font-bold bg-[#E5F1E3] text-[#255620]">Ejemplo</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center shrink-0" style={{ background: "conic-gradient(#2F6B2A 0 80%, #E5F1E3 0)" }}>
                    <div className="w-[74px] h-[74px] rounded-full bg-white flex flex-col items-center justify-center">
                      <p className="font-mono text-[28px] font-semibold leading-none">80</p>
                      <p className="text-[11px] font-semibold text-[#5B6980]">de 100</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="self-start inline-flex h-7 items-center px-3 rounded-full text-[13px] font-bold bg-[#2F6B2A] text-white">Nivel Avanzado</span>
                    <p className="text-[13px] font-semibold leading-snug text-[#41506A]">Ilustración de cómo ve su resultado cada local. No es un local real.</p>
                  </div>
                </div>
                {[
                  ["Documentación", 90, "#2F6B2A"],
                  ["Condiciones", 74, "#8A5A00"],
                  ["Capacitaciones", 100, "#2F6B2A"],
                ].map(([nombre, valor, color]) => (
                  <div key={String(nombre)} className="flex items-center gap-2.5 text-[13px] font-bold">
                    <span className="w-[130px] shrink-0">{nombre}</span>
                    <span className="flex-1 h-2 rounded-full bg-[#E8ECF1] overflow-hidden">
                      <span className="block h-full" style={{ width: `${valor}%`, background: String(color) }} />
                    </span>
                    <span className="font-mono w-9 text-right">{valor}%</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#16294A] border border-[#2A4068] rounded-2xl px-5 py-4 flex flex-col gap-2.5">
                <p className="text-sm font-extrabold text-[#E3B341]">Guía del día · ejemplo en el celular</p>
                <p className="flex items-center gap-2.5 text-sm font-bold"><span className="w-6 h-6 rounded-full bg-[#2F6B2A] flex items-center justify-center text-xs">✓</span>Temperatura de cámaras</p>
                <p className="flex items-center gap-2.5 text-sm font-bold"><span className="w-6 h-6 rounded-full bg-[#2F6B2A] flex items-center justify-center text-xs">✓</span>Agua potable</p>
                <p className="flex items-center gap-2.5 text-sm font-bold text-[#C9D3E3]"><span className="w-6 h-6 rounded-full border-2 border-[#8FA2C0]" />Limpieza de áreas · pendiente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F3]">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-16 flex flex-wrap items-center gap-10">
          <div className="flex-1 basis-[380px] flex flex-col gap-3.5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">El problema</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">El SEREMI puede llegar sin aviso.</h2>
            <p className="text-lg font-medium leading-relaxed text-[#41506A]">Si el local no tiene los registros al día y a mano en ese momento, arriesga multas, clausura temporal o perder la resolución sanitaria.</p>
          </div>
          <div className="flex-1 basis-[420px] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXIGEN.map((item) => (
              <div key={item.t} className="bg-white border border-[#DDE3EA] rounded-2xl p-5 flex flex-col gap-2">
                <span className="w-10 h-10 rounded-[10px] bg-[#FCE4E1] text-[#9A1C12] flex items-center justify-center font-extrabold">?</span>
                <p className="font-extrabold leading-snug">{item.t}</p>
                <p className="text-sm font-medium leading-snug text-[#41506A]">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20 sm:py-24 flex flex-col gap-12">
          <div className="max-w-[720px] flex flex-col gap-3.5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Qué hacemos por tu local</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">Un servicio anual completo: personas y plataforma.</h2>
            <p className="text-lg font-medium leading-relaxed text-[#41506A]">Un asesor asignado te visita, y todo lo que hace tu equipo cada día queda ordenado en un solo lugar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {SERVICIOS.map((servicio) => (
              <article key={servicio.titulo} className="bg-white border border-[#DDE3EA] rounded-2xl p-6 flex flex-col gap-4 border-t-[5px]" style={{ borderTopColor: servicio.color }}>
                <h3 className="text-[22px] font-extrabold leading-tight">{servicio.titulo}</h3>
                <ul className="flex flex-col gap-2.5">
                  {servicio.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[15px] font-semibold leading-snug">
                      <span style={{ color: servicio.color }} className="font-extrabold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-5 items-center bg-[#E5F1E3] rounded-2xl px-7 py-6">
            <div className="flex-1 basis-[360px]">
              <p className="text-lg font-extrabold text-[#255620]">Gestión ambiental con el Plan Integral</p>
              <p className="text-[15px] font-semibold leading-relaxed text-[#255620]">Segregación de residuos, declaraciones en Ventanilla Única, charlas ambientales y seguimiento de vencimientos.</p>
            </div>
            <a href="#planes" className="inline-flex items-center min-h-11 px-4 rounded-[10px] text-sm font-extrabold bg-[#255620] text-white">Ver planes</a>
          </div>
        </div>
      </section>

      <section id="proceso" className="bg-[#0B1B33] text-white">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20 sm:py-24 flex flex-col gap-12">
          <div className="max-w-[720px] flex flex-col gap-3.5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#E3B341]">Cómo funciona</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">Un ciclo mensual simple, sin papeleo suelto.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {PASOS.map((paso) => (
              <article key={paso.n} className="bg-[#16294A] border border-[#2A4068] rounded-2xl p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#E3B341] text-[#0B1B33] font-mono text-lg font-semibold flex items-center justify-center">{paso.n}</span>
                  <span className="text-[13px] font-bold uppercase tracking-wide text-[#E3B341]">{paso.cuando}</span>
                </div>
                <h3 className="text-xl font-extrabold leading-snug">{paso.titulo}</h3>
                <p className="text-[15px] font-medium leading-relaxed text-[#C9D3E3]">{paso.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sellos">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20 sm:py-24 flex flex-col gap-12">
          <div className="max-w-[720px] flex flex-col gap-3.5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Sistema de sellos</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">Cumplir tiene recompensa.</h2>
            <p className="text-lg font-medium leading-relaxed text-[#41506A]">Cada mes evaluamos tus registros, documentos, capacitaciones y tareas. El resultado es un sello que puedes mostrar a clientes e inspectores.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {SELLOS.map((sello) => (
              <article key={sello.nivel} className="bg-white border border-[#DDE3EA] rounded-2xl p-6 flex flex-col items-start gap-3.5">
                <span className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: sello.bg, color: sello.fg, boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${sello.bg}` }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <h3 className="text-[22px] font-extrabold">{sello.nivel}</h3>
                <p className="font-mono text-sm text-[#41506A]">{sello.rango}</p>
                <p className="text-[15px] font-medium leading-relaxed text-[#41506A]">{sello.texto}</p>
              </article>
            ))}
          </div>
          <div className="bg-[#0B1B33] text-white rounded-2xl px-8 py-7 flex flex-col gap-2">
            <p className="text-xl font-extrabold text-[#E3B341]">Beneficio exclusivo del nivel Premium</p>
            <p className="text-base font-medium leading-relaxed text-[#C9D3E3]">Orientación, revisión técnica y elaboración de descargos administrativos ante la autoridad, sin costo adicional, por materias del servicio contratado.</p>
            <p className="text-xs font-semibold text-[#9FB0CC]">Aplica según términos y condiciones del contrato.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F3]">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20 sm:py-24 flex flex-wrap items-center gap-14">
          <div className="flex-1 basis-[420px] flex flex-col gap-5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">La plataforma</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">Lo que hace tu equipo cada día, ordenado y respaldado.</h2>
            <ul className="flex flex-col gap-4">
              {PLATAFORMA.map((item) => (
                <li key={item.t} className="flex gap-3.5">
                  <span className="w-9 h-9 rounded-[10px] bg-[#E5F1E3] text-[#255620] flex items-center justify-center font-extrabold shrink-0">✓</span>
                  <span>
                    <span className="block text-[17px] font-extrabold">{item.t}</span>
                    <span className="block text-[15px] font-medium leading-relaxed text-[#41506A]">{item.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 basis-[420px] flex justify-center">
            <div className="w-full max-w-[400px] bg-white border border-[#DDE3EA] rounded-[28px] p-4 flex flex-col gap-3 shadow-[0_24px_60px_rgba(11,27,51,0.14)]">
              <div className="flex justify-between items-center">
                <p className="text-lg font-extrabold">Temperaturas de hoy</p>
                <span className="font-mono text-xs font-bold h-7 px-2.5 rounded-full bg-[#E0F1F4] text-[#0B5563] inline-flex items-center">Ejemplo</span>
              </div>
              <p className="text-xs font-semibold text-[#5B6980]">Pantalla de ejemplo. No corresponde a un local.</p>
              <FilaTemp nombre="Cámara 1" valor="3,8 °C" />
              <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#FCE4E1] border-2 border-[#B42318] text-[#7C170F]">
                <span className="w-6 h-6 rounded-full bg-[#B42318] text-white text-xs font-extrabold flex items-center justify-center">!</span>
                <span className="flex-1"><span className="block text-[15px] font-extrabold">Cámara 2</span><span className="block text-xs font-semibold">Fuera de rango · anota qué hiciste</span></span>
                <span className="font-mono text-xl font-semibold">7,4 °C</span>
              </div>
              <FilaTemp nombre="Congelador" valor="−19,2 °C" />
              <div className="h-[52px] rounded-xl bg-[#2F6B2A] text-white flex items-center justify-center font-extrabold">Guardar</div>
            </div>
          </div>
        </div>
      </section>

      <section id="planes">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20 sm:py-24 flex flex-col gap-12">
          <div className="max-w-[720px] flex flex-col gap-3.5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Planes</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">Elige el plan de tu local.</h2>
            <p className="text-lg font-medium leading-relaxed text-[#41506A]">Contrato anual de 12 meses. Valores mensuales en pesos chilenos. TODO: confirmar si incluyen IVA.</p>
          </div>
          <div className="flex flex-wrap gap-6 items-stretch">
            {PLANES.map((plan) => (
              <article key={plan.nombre} className="flex-1 basis-[440px] rounded-[20px] p-8 flex flex-col gap-5 border-2" style={{ background: plan.fondo, color: plan.texto, borderColor: plan.borde }}>
                <div className="flex justify-between items-center gap-3">
                  <h3 className="text-2xl font-extrabold">{plan.nombre}</h3>
                  <span className="inline-flex h-7 items-center px-3 rounded-full text-[13px] font-bold" style={{ background: plan.chipBg, color: plan.chipFg }}>{plan.etiqueta}</span>
                </div>
                <p className="flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-semibold tracking-tight">{formatCLP(plan.precio)}</span>
                  <span className="text-base font-bold opacity-80">/ mes</span>
                </p>
                <p className="text-sm font-bold opacity-85">Contrato anual · total {formatCLP(plan.precio * 12)}</p>
                <ul className="flex flex-col gap-3 pt-5 border-t" style={{ borderColor: plan.linea }}>
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[15px] font-semibold leading-snug">
                      <span className="font-extrabold" style={{ color: plan.tick }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="#contacto" className="mt-auto inline-flex items-center justify-center min-h-[52px] px-6 rounded-xl font-extrabold" style={{ background: plan.btnBg, color: plan.btnFg }}>{plan.cta}</a>
              </article>
            ))}
          </div>
          <div className="flex flex-col gap-3.5">
            <p className="font-extrabold">Servicios adicionales, con cotización aparte</p>
            <div className="flex flex-wrap gap-2.5">
              {ADICIONALES.map((item) => (
                <span key={item} className="inline-flex items-center min-h-11 px-4 rounded-full bg-[#F4F6F3] border border-[#DDE3EA] text-sm font-bold">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="preguntas" className="bg-[#F4F6F3]">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20 sm:py-24 flex flex-wrap gap-14">
          <div className="flex-1 basis-[300px] self-start flex flex-col gap-3.5">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2F6B2A]">Preguntas frecuentes</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">Lo que más nos preguntan.</h2>
            <p className="text-lg font-medium leading-relaxed text-[#41506A]">¿Tienes otra duda? Escríbenos y te respondemos.</p>
          </div>
          <div className="flex-[2] basis-[520px] min-w-0">
            {FAQ.map((item) => (
              <details key={item.p} className="border-b border-[#DDE3EA] group">
                <summary className="min-h-16 flex items-center text-lg font-extrabold cursor-pointer py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]">{item.p}</summary>
                <p className="mb-5 text-base font-medium leading-relaxed text-[#41506A] max-w-[760px]">{item.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-[#0B1B33] text-white">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20 sm:py-24 flex flex-wrap gap-14 items-start">
          <div className="flex-1 basis-[380px] flex flex-col gap-6">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#E3B341]">Contacto</p>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight">Agenda tu diagnóstico inicial.</h2>
            <p className="text-lg font-medium leading-relaxed text-[#C9D3E3]">Cuéntanos de tu local y coordinamos una visita para revisar cómo está hoy y qué falta para cumplir. Te respondemos en el día hábil.</p>
            <div className="flex flex-col gap-3">
              <Contacto etiqueta="WhatsApp" valor="TODO: número de WhatsApp" />
              <Contacto etiqueta="Correo" valor="TODO: correo de contacto" />
              <Contacto etiqueta="Cobertura" valor="Radio urbano de Osorno · TODO: horario de atención" />
            </div>
          </div>
          <DiagnosticoForm />
        </div>
      </section>

      <footer className="bg-[#081426] text-[#C9D3E3]">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 py-10 flex flex-wrap gap-6 items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <Escudo className="w-8 h-8" dorado />
              <span className="text-lg font-extrabold">{APP_NAME}</span>
            </div>
            <p className="text-sm font-semibold mt-1.5">{APP_TAGLINE} · Osorno, Chile</p>
          </div>
          <nav aria-label="Pie" className="flex flex-wrap gap-x-7 text-sm font-bold">
            <a href="#servicios" className="py-2.5">Servicios</a>
            <a href="#planes" className="py-2.5">Planes</a>
            <a href="#contacto" className="py-2.5">Contacto</a>
            <Link href="/politica-de-privacidad" className="py-2.5">Política de privacidad</Link>
            <Link href="/login" className="py-2.5">Iniciar sesión</Link>
          </nav>
          <p className="text-[13px] font-semibold text-[#9FB0CC]">© {new Date().getFullYear()} {APP_LEGAL_NAME}</p>
        </div>
      </footer>
    </div>
  );
}

function Contacto({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center gap-3.5 min-h-16 px-4 rounded-[14px] bg-[#16294A] border border-[#2A4068]">
      <span className="w-10 h-10 rounded-[10px] bg-[#E3B341] shrink-0" aria-hidden />
      <span>
        <span className="block text-xs font-semibold text-[#9FB0CC]">{etiqueta}</span>
        <span className="block text-[17px] font-bold">{valor}</span>
      </span>
    </div>
  );
}

function FilaTemp({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-[14px] border border-[#DDE3EA]">
      <span className="w-6 h-6 rounded-full bg-[#2F6B2A] text-white text-xs font-extrabold flex items-center justify-center">✓</span>
      <span className="flex-1 text-[15px] font-bold">{nombre}</span>
      <span className="font-mono text-xl font-semibold">{valor}</span>
    </div>
  );
}
