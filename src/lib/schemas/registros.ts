import { z } from "zod";

export const temperaturaSchema = z.object({
  fecha: z.string().min(1, "Selecciona fecha y hora"),
  temperatura_ingreso: z
    .number({ error: "Ingresa un número válido" })
    .min(-30)
    .max(120),
  temperatura_almacenamiento: z
    .number({ error: "Ingresa un número válido" })
    .min(-30)
    .max(120),
  responsable: z.string().min(2, "Ingresa el nombre del responsable"),
  observaciones: z.string().optional(),
});

export const limpiezaSchema = z.object({
  fecha: z.string().min(1, "Selecciona fecha y hora"),
  area: z.string().min(2, "Indica el área limpiada"),
  producto_utilizado: z.string().min(2, "Indica el producto utilizado"),
  responsable: z.string().min(2, "Ingresa el nombre del responsable"),
  conforme: z.boolean(),
  observaciones: z.string().optional(),
});

export const plagasSchema = z.object({
  fecha: z.string().min(1, "Selecciona fecha"),
  empresa_fumigadora: z.string().min(2, "Indica la empresa"),
  tipo_servicio: z.enum(["preventivo", "correctivo"], {
    message: "Selecciona tipo de servicio",
  }),
  areas_tratadas: z.string().min(2, "Indica las áreas tratadas"),
  productos_utilizados: z.string().min(2, "Indica los productos"),
  proxima_visita: z.string().optional(),
  responsable: z.string().min(2, "Ingresa el nombre del responsable"),
  conforme: z.boolean(),
  observaciones: z.string().optional(),
});

export type TemperaturaInput = z.infer<typeof temperaturaSchema>;
export type LimpiezaInput = z.infer<typeof limpiezaSchema>;
export type PlagasInput = z.infer<typeof plagasSchema>;
