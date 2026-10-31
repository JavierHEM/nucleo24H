import { z } from "zod";

export const TIPOS_LOCAL_DIAGNOSTICO = ["Restaurante", "Cafetería", "Cocinería", "Food truck", "Otro"] as const;

export const LIMITE_LEADS_POR_TELEFONO = 3;
export const LIMITE_LEADS_POR_HORA = 30;

export function normalizarTelefono(valor: string): string {
  return valor.replace(/[^\d+]/g, "");
}

export const diagnosticoSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80, "El nombre es demasiado largo."),
  local: z.string().trim().min(2, "Escribe el nombre del local.").max(120, "El nombre del local es demasiado largo."),
  telefono: z
    .string()
    .trim()
    .refine((valor) => {
      const digitos = valor.replace(/\D/g, "");
      return digitos.length >= 8 && digitos.length <= 15;
    }, "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678."),
  tipo: z.enum(TIPOS_LOCAL_DIAGNOSTICO, { message: "Selecciona un tipo de local." }),
  mensaje: z.string().trim().max(1000, "El mensaje no puede superar los 1000 caracteres.").optional(),
  sitio_web: z.string().max(0).optional(),
});

export type DiagnosticoInput = z.infer<typeof diagnosticoSchema>;
