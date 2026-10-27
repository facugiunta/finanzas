"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { MonthPoint } from "@/lib/metrics";

export function IncomeExpenseBar({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#525252"
          tick={{ fill: "#a3a3a3", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#262626" }}
        />
        <YAxis
          stroke="#525252"
          tick={{ fill: "#a3a3a3", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={70}
          tickFormatter={(v) => `$${formatNumber(v / 1000, 0)}k`}
        />
        <Tooltip
          cursor={{ fill: "#ffffff08" }}
          contentStyle={{
            background: "#171717",
            border: "1px solid #262626",
            borderRadius: 12,
            fontSize: 13,
          }}
          labelStyle={{ color: "#e5e5e5" }}
          formatter={(value, name) => [formatCurrency(Number(value)), name]}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="egresos" name="Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
