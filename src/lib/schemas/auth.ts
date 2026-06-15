import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Debe contener mayúsculas, minúsculas y números"
    ),
  nombre: z.string().min(2, "Ingresa tu nombre completo"),
  nombre_local: z.string().min(2, "Ingresa el nombre de tu local"),
  rut_local: z
    .string()
    .regex(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, "RUT inválido (ej: 12.345.678-9)"),
  direccion: z.string().min(5, "Ingresa la dirección completa"),
  plan: z.enum(["calidad", "integral"]),
  // RF-55: Consentimiento expreso — Art. 12 Ley 21.719
  consentimiento_datos: z
    .boolean()
    .refine((v) => v === true, "Debes aceptar el tratamiento de datos"),
  consentimiento_terminos: z
    .boolean()
    .refine((v) => v === true, "Debes aceptar los términos de uso"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
