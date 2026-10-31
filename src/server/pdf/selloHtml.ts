import { APP_FOOTER, APP_NAME } from "@/lib/branding";
import { escapeHtml } from "@/lib/escapeHtml";

const NIVEL_COLOR: Record<string, string> = {
  inicial: "#B42318",
  intermedio: "#B45309",
  avanzado: "#2F6B2A",
  premium: "#0B1B33",
};

const DIMENSIONES = [
  { clave: "score_documentacion", etiqueta: "Documentación y registros", peso: 30 },
  { clave: "score_condiciones", etiqueta: "Condiciones sanitarias", peso: 25 },
  { clave: "score_capacitaciones", etiqueta: "Capacitaciones", peso: 25 },
  { clave: "score_tareas", etiqueta: "Tareas completadas", peso: 20 },
] as const;

export type SelloPdfDatos = {
  local: string;
  direccion: string;
  periodoDisplay: string;
  nivel: string;
  scoreGeneral: number;
  scores: Record<(typeof DIMENSIONES)[number]["clave"], number>;
  emitidoAt: Date;
  planMejoras: string[];
  descargosHabilitados: boolean;
  selloId: string;
  verificacionUrl: string;
  qrDataUrl: string;
  logoSrc: string;
};

function colorPorScore(score: number): string {
  if (score >= 80) return "#2F6B2A";
  if (score >= 60) return "#B45309";
  return "#B42318";
}

const fecha = (valor: Date) => valor.toLocaleDateString("es-CL");

function codigoCorto(selloId: string): string {
  return selloId.slice(0, 8).toUpperCase();
}

function qrMarkup(qr: string): string {
  if (qr.startsWith("<svg")) return qr.replace("<svg", '<svg role="img" aria-label="Código QR de verificación"');
  return `<img src="${qr}" alt="Código QR de verificación" width="104" height="104" />`;
}

export function construirHtmlSello(datos: SelloPdfDatos): string {
  const nivelColor = NIVEL_COLOR[datos.nivel] ?? "#0B1B33";

  const filas = DIMENSIONES.map(({ clave, etiqueta, peso }) => {
    const score = datos.scores[clave];
    const color = colorPorScore(score);
    return `<div class="fila">
      <div class="fila-texto"><span class="fila-nombre">${etiqueta}</span><span class="fila-peso">Peso ${peso}%</span></div>
      <div class="barra"><div class="barra-relleno" style="width:${Math.max(0, Math.min(100, score))}%;background:${color}"></div></div>
      <span class="fila-score" style="color:${color}">${score.toFixed(0)}%</span>
    </div>`;
  }).join("");

  const mejoras = datos.planMejoras.length
    ? `<section class="bloque">
        <h2 class="titulo-seccion">Plan de mejoras</h2>
        ${datos.planMejoras
          .map(
            (mejora, indice) =>
              `<div class="mejora"><span class="mejora-num">${indice + 1}</span><p>${escapeHtml(mejora)}</p></div>`
          )
          .join("")}
      </section>`
    : "";

  const descargos = datos.descargosHabilitados
    ? `<section class="descargos">
        <p class="descargos-titulo">Descargos administrativos habilitados</p>
        <p class="descargos-texto">Con sello Premium, el local dispone de descargos gratuitos ante la autoridad sanitaria. Coordina su uso con tu asesor.</p>
      </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Informe de sello ${escapeHtml(datos.periodoDisplay)} — ${escapeHtml(datos.local)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Manrope', Arial, sans-serif; color: #0B1B33; background: #fff; }
  .pagina { width: 794px; min-height: 1123px; display: flex; flex-direction: column; }
  .cabecera { background: #0B1B33; color: #fff; padding: 36px 48px 32px; }
  .cabecera-fila { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  .logo { display: block; width: 190px; height: auto; }
  .etiqueta { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); white-space: nowrap; }
  .cabecera h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 6px; }
  .cabecera p { font-size: 14px; color: rgba(255,255,255,0.72); }
  .cuerpo { padding: 36px 48px 16px; flex: 1; }
  .resumen { display: flex; justify-content: space-between; align-items: center; border: 1px solid #DDE3EA; border-left: 6px solid ${nivelColor}; border-radius: 12px; padding: 24px 28px; margin-bottom: 32px; }
  .score { font-size: 64px; font-weight: 800; line-height: 1; color: ${nivelColor}; letter-spacing: -0.02em; }
  .nivel { display: inline-block; margin-top: 10px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: ${nivelColor}; border: 2px solid ${nivelColor}; border-radius: 6px; padding: 3px 10px; }
  .meta { text-align: right; font-size: 13px; color: #41506A; line-height: 1.7; }
  .meta strong { display: block; color: #0B1B33; font-size: 15px; text-transform: capitalize; }
  .meta strong + span { display: block; margin-top: 8px; }
  .bloque { margin-bottom: 28px; }
  .titulo-seccion { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #5B6980; margin-bottom: 16px; }
  .fila { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; break-inside: avoid; }
  .fila-texto { width: 230px; flex-shrink: 0; }
  .fila-nombre { display: block; font-size: 14px; font-weight: 700; }
  .fila-peso { display: block; font-size: 11px; color: #5B6980; margin-top: 2px; }
  .barra { flex: 1; height: 10px; background: #E6EBF0; border-radius: 9999px; overflow: hidden; }
  .barra-relleno { height: 100%; border-radius: 9999px; }
  .fila-score { width: 48px; text-align: right; font-size: 15px; font-weight: 800; flex-shrink: 0; }
  .mejora { display: flex; gap: 12px; margin-bottom: 10px; break-inside: avoid; }
  .mejora-num { width: 24px; height: 24px; border-radius: 6px; background: #E5F1E3; color: #255620; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mejora p { font-size: 13px; line-height: 1.55; color: #334155; padding-top: 3px; }
  .descargos { background: #F1F6EF; border-left: 6px solid #2F6B2A; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; break-inside: avoid; }
  .descargos-titulo { font-size: 14px; font-weight: 800; color: #255620; margin-bottom: 4px; }
  .descargos-texto { font-size: 12px; line-height: 1.5; color: #334155; }
  .verificacion { display: flex; align-items: center; gap: 20px; border-top: 1px solid #DDE3EA; padding: 20px 48px; break-inside: avoid; }
  .verificacion img, .verificacion svg { width: 104px; height: 104px; flex-shrink: 0; display: block; }
  .verificacion-titulo { font-size: 13px; font-weight: 800; margin-bottom: 4px; }
  .verificacion-texto { font-size: 12px; color: #41506A; line-height: 1.5; overflow-wrap: anywhere; }
  .verificacion-codigo { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.04em; }
  .pie { background: #F4F6F3; padding: 16px 48px; display: flex; justify-content: space-between; font-size: 11px; color: #5B6980; }
</style>
</head>
<body>
<div class="pagina">
  <header class="cabecera">
    <div class="cabecera-fila">
      <img class="logo" src="${datos.logoSrc}" alt="${escapeHtml(APP_NAME)}" />
      <span class="etiqueta">INFORME MENSUAL BPM</span>
    </div>
    <h1>${escapeHtml(datos.local)}</h1>
    <p>${escapeHtml(datos.direccion)}${datos.direccion ? " · " : ""}${escapeHtml(datos.periodoDisplay)}</p>
  </header>

  <main class="cuerpo">
    <section class="resumen">
      <div>
        <div class="score">${datos.scoreGeneral.toFixed(1)}%</div>
        <span class="nivel">${escapeHtml(datos.nivel)}</span>
      </div>
      <div class="meta">
        Período
        <strong>${escapeHtml(datos.periodoDisplay)}</strong>
        <span>Emitido el</span>
        <strong>${fecha(datos.emitidoAt)}</strong>
      </div>
    </section>

    <section class="bloque">
      <h2 class="titulo-seccion">Desglose por dimensión</h2>
      ${filas}
    </section>

    ${mejoras}
    ${descargos}
  </main>

  <section class="verificacion">
    ${qrMarkup(datos.qrDataUrl)}
    <div>
      <p class="verificacion-titulo">Verifica la autenticidad de este informe</p>
      <p class="verificacion-texto">Escanea el código o ingresa a ${escapeHtml(datos.verificacionUrl)}</p>
      <p class="verificacion-texto">Código del sello: <span class="verificacion-codigo">${escapeHtml(codigoCorto(datos.selloId))}</span></p>
    </div>
  </section>

  <footer class="pie">
    <span>${escapeHtml(APP_FOOTER)}</span>
    <span>Generado el ${fecha(new Date())}</span>
  </footer>
</div>
</body>
</html>`;
}
