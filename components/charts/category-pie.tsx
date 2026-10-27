"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { CategoryPoint } from "@/lib/metrics";

// Paleta estable por orden de categoría
const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#a3a3a3",
];

export function CategoryPie({ data }: { data: CategoryPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-neutral-500">
        Sin gastos este mes
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#171717",
            border: "1px solid #262626",
            borderRadius: 12,
            fontSize: 13,
          }}
          formatter={(value, name) => [formatCurrency(Number(value)), name]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (
            <span style={{ color: "#a3a3a3" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
