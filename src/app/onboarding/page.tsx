export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinoTrasOnboarding } from "@/lib/auth/enlaceInvitacion";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=auth_callback");
  }

  const params = await searchParams;
  const rol = typeof user.app_metadata?.rol === "string" ? user.app_metadata.rol : null;
  const next = destinoTrasOnboarding(params.next, rol);
  const nombreInicial =
    typeof user.user_metadata?.nombre === "string" ? user.user_metadata.nombre : "";

  if (user.user_metadata?.clave_definida === true) {
    redirect(next);
  }

  return <OnboardingForm next={next} nombreInicial={nombreInicial} />;
}
