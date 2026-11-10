import { z } from "zod";
import { claveRut } from "@/lib/empresas";
import { normalizarEmail } from "@/lib/auth/email";
import { PLAN_IDS, TIPOS_LOCAL } from "@/lib/planes";

export function esTelefonoValido(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 8 && digitos.length <= 15;
}

export function textoOpcional(valor: string | undefined) {
  const limpio = valor?.trim() ?? "";
  return limpio === "" ? undefined : limpio;
}

export function emailOpcional(valor: string | undefined) {
  const limpio = textoOpcional(valor);
  return limpio ? normalizarEmail(limpio) : undefined;
}

const MSG_TELEFONO = "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678.";

export const rutSchema = z
  .string()
  .trim()
  .min(8, "RUT inválido")
  .max(12, "RUT inválido")
  .transform((valor) => claveRut(valor));

export const telefonoSchema = z
  .string()
  .trim()
  .refine(esTelefonoValido, MSG_TELEFONO);

export const telefonoOpcionalSchema = z
  .string()
  .trim()
  .refine((valor) => valor === "" || esTelefonoValido(valor), MSG_TELEFONO);

export const emailOpcionalSchema = z
  .string()
  .trim()
  .refine((valor) => {
    if (valor === "") return true;
    return z.string().email().safeParse(normalizarEmail(valor)).success;
  }, "Email inválido");

export const empresaFichaSchema = z.object({
  razon_social: z.string().trim().min(2, "Ingresa la razón social").max(160),
  rut: rutSchema,
  giro: z.string().trim().max(160),
  domicilio_legal: z.string().trim().max(200),
  telefono: telefonoSchema,
  email: emailOpcionalSchema,
  representante_legal_nombre: z.string().trim().min(2, "Ingresa el representante legal").max(120),
  representante_legal_rut: rutSchema,
  representante_legal_telefono: telefonoOpcionalSchema,
  notas_internas: z.string().trim().max(2000),
});

export const localOperativoSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa el nombre del local").max(120),
  direccion: z.string().trim().min(3, "Ingresa la dirección").max(200),
  ciudad: z.string().trim().min(2, "Ingresa la ciudad").max(80),
  telefono: telefonoSchema,
  tipo_local: z.enum(TIPOS_LOCAL),
  encargado_nombre: z.string().trim().max(120),
  encargado_telefono: telefonoOpcionalSchema,
});

export const altaEmpresaSchema = z.object({
  empresa: empresaFichaSchema,
  local: localOperativoSchema,
  plan: z.enum(PLAN_IDS),
  email_admin: emailOpcionalSchema,
});

export const altaSucursalSchema = localOperativoSchema.extend({
  casa_central_id: z.string().uuid(),
  plan: z.enum(PLAN_IDS),
  email_admin: emailOpcionalSchema,
});

export const actualizarEmpresaSchema = empresaFichaSchema.extend({
  id: z.string().uuid(),
});

export type EmpresaFichaInput = z.infer<typeof empresaFichaSchema>;
export type LocalOperativoInput = z.infer<typeof localOperativoSchema>;
export type AltaEmpresaInput = z.infer<typeof altaEmpresaSchema>;
export type AltaSucursalInput = z.infer<typeof altaSucursalSchema>;
