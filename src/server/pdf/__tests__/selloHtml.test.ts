import { describe, it, expect } from "vitest";
import { construirHtmlSello, type SelloPdfDatos } from "@/server/pdf/selloHtml";

const base: SelloPdfDatos = {
  local: "Cocinería <b>Don Luis</b>",
  direccion: "Calle 123, Osorno",
  periodoDisplay: "octubre de 2026",
  nivel: "avanzado",
  scoreGeneral: 82.4,
  scores: { score_documentacion: 90, score_condiciones: 75, score_capacitaciones: 85, score_tareas: 55 },
  emitidoAt: new Date("2026-11-01T12:00:00Z"),
  planMejoras: ["Registrar temperaturas <script>alert(1)</script> a diario"],
  descargosHabilitados: false,
  selloId: "11111111-1111-1111-1111-111111111111",
  verificacionUrl: "https://nucleo24h.cl/sello/11111111-1111-1111-1111-111111111111",
  qrDataUrl: "data:image/png;base64,AAAA",
  logoSrc: "data:image/png;base64,BBBB",
};

describe("construirHtmlSello", () => {
  it("escapa el contenido dinámico", () => {
    const html = construirHtmlSello(base);
    expect(html).not.toContain("<b>Don Luis</b>");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("incluye logo, QR y enlace de verificación", () => {
    const html = construirHtmlSello(base);
    expect(html).toContain("data:image/png;base64,BBBB");
    expect(html).toContain("data:image/png;base64,AAAA");
    expect(html).toContain(base.verificacionUrl);
    expect(html).toContain('verificacion-codigo">11111111</span>');
  });

  it("incrusta un QR SVG sin escaparlo", () => {
    const html = construirHtmlSello({
      ...base,
      qrDataUrl: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
    });
    expect(html).toContain('<svg role="img" aria-label="Código QR de verificación"');
    expect(html).not.toContain("&lt;svg");
  });

  it("muestra el aviso de descargos solo cuando están habilitados", () => {
    expect(construirHtmlSello(base)).not.toContain("Descargos administrativos habilitados");
    expect(construirHtmlSello({ ...base, descargosHabilitados: true })).toContain(
      "Descargos administrativos habilitados"
    );
  });

  it("omite el plan de mejoras cuando no hay", () => {
    expect(construirHtmlSello({ ...base, planMejoras: [] })).not.toContain("Plan de mejoras");
  });

  it("colorea cada dimensión según su score", () => {
    const html = construirHtmlSello(base);
    expect(html).toContain("#2F6B2A");
    expect(html).toContain("#B45309");
    expect(html).toContain("#B42318");
  });

  it("no usa emojis", () => {
    expect(construirHtmlSello({ ...base, descargosHabilitados: true })).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
