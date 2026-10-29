import { z } from "zod";
import { DECLARACIONES_VU_ANUALES } from "@/lib/planes";

export const TIPOS_AMBIENTAL = ["segregacion", "ventanilla_unica", "charla", "asesoria"] as const;
export type TipoAmbiental = (typeof TIPOS_AMBIENTAL)[number];

export const TIPO_AMBIENTAL_LABEL: Record<TipoAmbiental, string> = {
  segregacion: "Segregación de residuos",
  ventanilla_unica: "Declaración en Ventanilla Única",
  charla: "Charla ambiental",
  asesoria: "Asesoría ambiental",
};

export const registroAmbientalSchema = z.object({
  tipo: z.enum(TIPOS_AMBIENTAL),
  fecha: z.string().datetime(),
  detalle: z.string().trim().min(3, "Describe brevemente lo realizado.").max(1000),
  folio: z.string().trim().max(60).optional(),
  vence: z.string().datetime().optional(),
});

export type RegistroAmbientalInput = z.infer<typeof registroAmbientalSchema>;

export type RegistroAmbientalLike = {
  tipo: string;
  fecha: Date;
  vence?: Date | null;
};

export function contarDeclaraciones(
  registros: readonly RegistroAmbientalLike[],
  ciclo: { inicio: Date; fin: Date }
): number {
  return registros.filter(
    (registro) => registro.tipo === "ventanilla_unica" && registro.fecha >= ciclo.inicio && registro.fecha < ciclo.fin
  ).length;
}

export function declaracionesRestantes(usadas: number): number {
  return Math.max(0, DECLARACIONES_VU_ANUALES - usadas);
}

export function vencimientosProximos<T extends RegistroAmbientalLike>(
  registros: readonly T[],
  ahora: Date = new Date(),
  dias = 60
): T[] {
  const limite = new Date(ahora.getTime() + dias * 86_400_000);
  return registros
    .filter((registro) => registro.vence && registro.vence <= limite)
    .sort((a, b) => a.vence!.getTime() - b.vence!.getTime());
}
