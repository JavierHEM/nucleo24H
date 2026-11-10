export const dynamic = "force-dynamic";

import { ConfirmarAcceso } from "./ConfirmarAcceso";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string; code?: string }>;
}) {
  const params = await searchParams;
  return (
    <ConfirmarAcceso
      tokenHash={params.token_hash ?? null}
      type={params.type ?? null}
      next={params.next ?? null}
      code={params.code ?? null}
    />
  );
}
