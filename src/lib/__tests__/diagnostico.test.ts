import { describe, it, expect } from "vitest";
import { diagnosticoSchema, normalizarTelefono } from "@/lib/diagnostico";
import { escapeHtml } from "@/lib/escapeHtml";

const valido = { nombre: "Ana Pérez", local: "Cocinería Don Luis", telefono: "+56 9 1234 5678", tipo: "Cocinería" };

describe("diagnosticoSchema", () => {
  it("acepta una solicitud completa", () => {
    expect(diagnosticoSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza teléfonos demasiado cortos con mensaje en español", () => {
    const resultado = diagnosticoSchema.safeParse({ ...valido, telefono: "12345" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].message).toContain("teléfono válido");
  });

  it("rechaza un tipo de local fuera de la lista", () => {
    expect(diagnosticoSchema.safeParse({ ...valido, tipo: "Hotel" }).success).toBe(false);
  });

  it("rechaza el campo trampa cuando viene con contenido", () => {
    expect(diagnosticoSchema.safeParse({ ...valido, sitio_web: "http://spam" }).success).toBe(false);
  });

  it("exige nombre y local", () => {
    expect(diagnosticoSchema.safeParse({ ...valido, nombre: " " }).success).toBe(false);
    expect(diagnosticoSchema.safeParse({ ...valido, local: "" }).success).toBe(false);
  });
});

describe("normalizarTelefono", () => {
  it("deja solo dígitos y el signo +", () => {
    expect(normalizarTelefono("+56 9 1234-5678")).toBe("+56912345678");
  });
});

describe("escapeHtml", () => {
  it("neutraliza etiquetas y comillas", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;"
    );
  });
});
