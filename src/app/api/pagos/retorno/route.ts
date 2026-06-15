import { NextRequest, NextResponse } from "next/server";

/**
 * urlReturn de Flow.cl: Flow devuelve al usuario con un POST.
 * Las páginas de Next.js no aceptan POST, así que redirigimos 303
 * a la página de suscripción (el estado real lo actualiza el webhook).
 */
export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL("/suscripcion?retorno=1", req.url), 303);
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/suscripcion?retorno=1", req.url), 303);
}
