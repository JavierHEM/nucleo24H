import { describe, expect, it } from "vitest";
import { GRUPOS_PROTOCOLO, PROTOCOLOS, urlOficial } from "@/lib/bpm/biblioteca";

describe("biblioteca oficial", () => {
  it("agrupa los diez procedimientos en POES, POE y BPM", () => {
    const grupos = new Set(PROTOCOLOS.map((item) => item.grupo));
    expect(grupos).toEqual(new Set(GRUPOS_PROTOCOLO.map((grupo) => grupo.id)));
    expect(PROTOCOLOS).toHaveLength(10);
    expect(PROTOCOLOS.filter((item) => item.grupo === "poes").map((item) => item.codigo)).toEqual([
      "PR-BPM-02",
    ]);
  });

  it("apunta cada descarga a un archivo del bucket público", () => {
    const paths = PROTOCOLOS.flatMap((item) => [
      item.procedimiento.path,
      ...item.plantillas.map((plantilla) => plantilla.path),
    ]);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith("v1/") && path.endsWith(".docx"))).toBe(true);
    expect(urlOficial("v1/PR-BPM-02.docx", "https://ejemplo.supabase.co")).toBe(
      "https://ejemplo.supabase.co/storage/v1/object/public/bpm-oficial/v1/PR-BPM-02.docx"
    );
  });
});
