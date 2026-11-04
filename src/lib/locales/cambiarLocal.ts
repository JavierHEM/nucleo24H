export function rutaTrasCambioDeLocal(pathname: string, search = "") {
  const seccion = pathname.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}.*$/i, "") || "/";
  return `${seccion}${search}`;
}

export async function cambiarLocalActivo(tenantId: string, destino?: string) {
  const respuesta = await fetch("/api/tenant/switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId }),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null;
    throw new Error(cuerpo?.error ?? "No se pudo cambiar de local.");
  }
  const url =
    destino ?? rutaTrasCambioDeLocal(window.location.pathname, window.location.search);
  window.location.assign(url);
}
