"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPeriodo } from "@/lib/utils";

interface DataPoint {
  periodo: string;
  score: number;
  nivel: string;
}

interface EvolucionChartProps {
  data: DataPoint[];
}

export function EvolucionChart({ data }: EvolucionChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: formatPeriodo(d.periodo).slice(0, 3),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolución del Sello</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Score"]}
            />
            <ReferenceLine y={90} stroke="#111827" strokeDasharray="3 3" label={{ value: "Premium", fontSize: 10 }} />
            <ReferenceLine y={75} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Avanzado", fontSize: 10 }} />
            <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Intermedio", fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
