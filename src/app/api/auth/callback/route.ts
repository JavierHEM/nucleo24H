export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/**
 * El verifyOtp en el servidor se colgaba con invitaciones reales.
 * Pasamos los query params a la página cliente, que confirma en el navegador.
 */
export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/auth/callback";
  return NextResponse.redirect(url);
}
