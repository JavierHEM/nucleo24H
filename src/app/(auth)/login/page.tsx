export const dynamic = "force-dynamic";

import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mensaje?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      next={params.next ?? "/"}
      errorParam={params.error ?? null}
      mensaje={params.mensaje ?? null}
    />
  );
}
