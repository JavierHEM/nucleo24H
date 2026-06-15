import { z } from "zod";

export const PesosSchema = z.object({
  documentacion: z.number().min(0).max(1),
  condiciones: z.number().min(0).max(1),
  capacitaciones: z.number().min(0).max(1),
  tareas: z.number().min(0).max(1),
});

export const UmbralesSchema = z.object({
  intermedio: z.number().min(0).max(100),
  avanzado: z.number().min(0).max(100),
  premium: z.number().min(0).max(100),
});

export const SelloInputSchema = z.object({
  score_documentacion: z.number().min(0).max(100),
  score_condiciones: z.number().min(0).max(100),
  score_capacitaciones: z.number().min(0).max(100),
  score_tareas: z.number().min(0).max(100),
  pesos: PesosSchema,
  umbrales: UmbralesSchema,
});

export type NivelSello = "inicial" | "intermedio" | "avanzado" | "premium";

export const SelloResultSchema = z.object({
  nivel: z.enum(["inicial", "intermedio", "avanzado", "premium"]),
  score_general: z.number().min(0).max(100),
  score_documentacion: z.number(),
  score_condiciones: z.number(),
  score_capacitaciones: z.number(),
  score_tareas: z.number(),
  plan_mejoras: z.array(z.string()),
  descargos_habilitados: z.boolean(),
  pesos_usados: PesosSchema,
  umbrales_usados: UmbralesSchema,
});

export type SelloInput = z.infer<typeof SelloInputSchema>;
export type SelloResult = z.infer<typeof SelloResultSchema>;
export type Pesos = z.infer<typeof PesosSchema>;
export type Umbrales = z.infer<typeof UmbralesSchema>;

export const PESOS_DEFAULT: Pesos = {
  documentacion: 0.30,
  condiciones: 0.25,
  capacitaciones: 0.25,
  tareas: 0.20,
};

export const UMBRALES_DEFAULT: Umbrales = {
  intermedio: 60,
  avanzado: 75,
  premium: 90,
};

/** Umbrales mínimos por dimensión para considerar que "no hay brecha" */
export const BRECHAS_THRESHOLDS = {
  documentacion: 80,
  condiciones: 80,
  capacitaciones: 75,
  tareas: 70,
} as const;
