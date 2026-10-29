import { z } from "zod";

const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Resend — opcional hasta Sprint 5
  RESEND_API_KEY: z.string().optional(),

  // Flow.cl — opcional hasta que el cliente cree la cuenta
  FLOW_API_KEY: z.string().optional(),
  FLOW_SECRET: z.string().optional(),
  FLOW_WEBHOOK_SECRET: z.string().optional(),
  FLOW_BASE_URL: z.string().url().optional(), // sandbox: https://sandbox.flow.cl/api

  // Mercado Pago — opcional hasta que el cliente cree la cuenta
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),

  // Browserless — opcional hasta Sprint 6
  BROWSERLESS_TOKEN: z.string().optional(),

  // Cron jobs (Vercel Cron lo envía como Authorization: Bearer <secret>)
  CRON_SECRET: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

function createEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Variables de entorno inválidas:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Variables de entorno inválidas. Revisa .env.local");
  }
  return parsed.data;
}

function createPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    throw new Error("Variables públicas de entorno inválidas.");
  }
  return parsed.data;
}

export const env =
  typeof window === "undefined" ? createEnv() : (process.env as unknown as Env);

export const publicEnv = createPublicEnv();
