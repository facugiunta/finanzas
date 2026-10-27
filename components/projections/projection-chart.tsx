"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { ProjectionPoint } from "@/lib/projections";

export function ProjectionChart({ data }: { data: ProjectionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="#525252"
          tick={{ fill: "#a3a3a3", fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          stroke="#525252"
          tick={{ fill: "#a3a3a3", fontSize: 11 }}
          tickLine={false}
          width={64}
          tickFormatter={(v) => `$${formatNumber(v / 1000, 0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: "#171717",
            border: "1px solid #262626",
            borderRadius: 12,
            fontSize: 13,
          }}
          labelFormatter={(d) => `Día ${d}`}
          formatter={(v, name) => [formatCurrency(Number(v)), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="real"
          name="Gasto real acumulado"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="proyeccion"
          name="Proyección"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
