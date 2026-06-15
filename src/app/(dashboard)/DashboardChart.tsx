"use client";

import { EvolucionChart } from "@/components/dashboard/EvolucionChart";

interface Props {
  data: Array<{ periodo: string; score: number; nivel: string }>;
}

export function DashboardChart({ data }: Props) {
  return <EvolucionChart data={data} />;
}
