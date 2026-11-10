"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { destinoTrasOnboarding, esTipoOtp } from "@/lib/auth/enlaceInvitacion";
import { BrandLogo } from "@/components/BrandLogo";

const TIMEOUT_MS = 12_000;

function conTimeout<T>(promesa: Promise<T>, ms: number) {
  return Promise.race<T>([
    promesa,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

export function ConfirmarAcceso({
  tokenHash,
  type,
  next,
  code,
}: {
  tokenHash?: string | null;
  type?: string | null;
  next?: string | null;
  code?: string | null;
}) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("Activando tu cuenta…");

  useEffect(() => {
    let cancelado = false;

    async function destinoDe(user: User | null) {
      const rol = typeof user?.app_metadata?.rol === "string" ? user.app_metadata.rol : null;
      const despues = destinoTrasOnboarding(next, rol);
      const sinClave = user?.user_metadata?.clave_definida !== true;
      const invitado = type === "invite" || Boolean(user?.invited_at);
      return invitado && sinClave ? `/onboarding?next=${encodeURIComponent(despues)}` : despues;
    }

    async function ir(user: User | null) {
      const destino = await destinoDe(user);
      if (cancelado) return;
      router.replace(destino);
      router.refresh();
    }

    async function run() {
      const supabase = createClient();

      if (typeof window !== "undefined" && window.location.hash) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access = hash.get("access_token");
        const refresh = hash.get("refresh_token");
        if (access && refresh) {
          const { data, error } = await supabase.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          });
          if (!error && data.user) {
            await ir(data.user);
            return;
          }
        }
      }

      if (code) {
        const { data, error } = await conTimeout(supabase.auth.exchangeCodeForSession(code), TIMEOUT_MS);
        if (!error && data.user) {
          await ir(data.user);
          return;
        }
      }

      if (tokenHash) {
        const tipos: EmailOtpType[] = [];
        if (esTipoOtp(type ?? null)) tipos.push(type as EmailOtpType);
        if (type !== "email") tipos.push("email");
        for (const tipo of tipos) {
          try {
            const { data, error } = await conTimeout(
              supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash }),
              TIMEOUT_MS
            );
            if (!error && data.user) {
              await ir(data.user);
              return;
            }
          } catch {
            // timeout o red: pruebo el siguiente tipo
          }
        }
      }

      if (!cancelado) {
        setMensaje("Ese enlace no activó la cuenta.");
        router.replace("/login?error=auth_callback");
      }
    }

    void run();
    return () => {
      cancelado = true;
    };
  }, [tokenHash, type, next, code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F3] px-4">
      <BrandLogo className="w-44 mb-8" />
      <p className="text-sm text-[#5B6980]">{mensaje}</p>
    </div>
  );
}
