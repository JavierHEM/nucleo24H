import type { NextRequest } from "next/server";
import { procesarWebhookMercadoPago } from "@/server/payments/procesarWebhookMercadoPago";

export function POST(req: NextRequest) {
  return procesarWebhookMercadoPago(req, "prueba");
}
