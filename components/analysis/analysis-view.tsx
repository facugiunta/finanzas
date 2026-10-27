"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  availableMonths,
  categoryEvolution,
  expenseCategoriesForMonth,
  monthLabel,
  topExpenses,
} from "@/lib/metrics";
import { CATEGORIES } from "@/lib/categories";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import type { Movement } from "@/types";

const CHART_TT = {
  background: "#171717",
  border: "1px solid #262626",
  borderRadius: 12,
  fontSize: 13,
};
const kFmt = (v: number) => `$${formatNumber(v / 1000, 0)}k`;

const selectCls =
  "rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-neutral-300">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function AnalysisView({ movements }: { movements: Movement[] }) {
  const months = useMemo(() => availableMonths(movements), [movements]);

  const [month, setMonth] = useState(months[0]?.key ?? "");
  const [monthA, setMonthA] = useState(months[1]?.key ?? months[0]?.key ?? "");
  const [monthB, setMonthB] = useState(months[0]?.key ?? "");
  const [category, setCategory] = useState<string>("Comida y delivery");

  const catBreakdown = useMemo(
    () => expenseCategoriesForMonth(movements, month),
    [movements, month]
  );
  const monthTotal = catBreakdown.reduce((s, c) => s + c.total, 0);

  const top5 = useMemo(() => topExpenses(movements, month, 5), [movements, month]);

  const evolution = useMemo(
    () => categoryEvolution(movements, category),
    [movements, category]
  );

  const comparison = useMemo(() => {
    const a = new Map(
      expenseCategoriesForMonth(movements, monthA).map((c) => [c.category, c.total])
    );
    const b = new Map(
      expenseCategoriesForMonth(movements, monthB).map((c) => [c.category, c.total])
    );
    const cats = new Set([...a.keys(), ...b.keys()]);
    return [...cats]
      .map((c) => ({ category: c, a: a.get(c) ?? 0, b: b.get(c) ?? 0 }))
      .sort((x, y) => y.a + y.b - (x.a + x.b));
  }, [movements, monthA, monthB]);

  if (movements.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-500">
        No hay datos para analizar todavía. Cargá movimientos primero.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Gasto por categoría del mes */}
      <Card
        title="Gasto por categoría"
        right={
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={selectCls}
          >
            {months.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        }
      >
        {catBreakdown.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin gastos este mes.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={Math.max(200, catBreakdown.length * 38)}>
              <BarChart
                data={catBreakdown}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#525252"
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  tickFormatter={kFmt}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={130}
                  stroke="#525252"
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff08" }}
                  contentStyle={CHART_TT}
                  formatter={(v) => [formatCurrency(Number(v)), "Gasto"]}
                />
                <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {catBreakdown.map((c) => (
                <div key={c.category} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">{c.category}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-neutral-500">
                      {monthTotal ? Math.round((c.total / monthTotal) * 100) : 0}%
                    </span>
                    <span className="font-medium text-neutral-200">
                      {formatCurrency(c.total)}
                    </span>
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-neutral-800 pt-2 text-sm">
                <span className="font-medium">Total</span>
                <span className="font-semibold text-rose-400">
                  {formatCurrency(monthTotal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Comparativa mes A vs mes B */}
      <Card
        title="Comparativa entre meses"
        right={
          <div className="flex items-center gap-2">
            <select value={monthA} onChange={(e) => setMonthA(e.target.value)} className={selectCls}>
              {months.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
            <span className="text-neutral-500">vs</span>
            <select value={monthB} onChange={(e) => setMonthB(e.target.value)} className={selectCls}>
              {months.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
        }
      >
        {comparison.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin gastos para comparar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, comparison.length * 44)}>
            <BarChart data={comparison} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
              <XAxis type="number" stroke="#525252" tick={{ fill: "#a3a3a3", fontSize: 11 }} tickFormatter={kFmt} />
              <YAxis type="category" dataKey="category" width={130} stroke="#525252" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={CHART_TT} formatter={(v) => formatCurrency(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="a" name={monthLabel(monthA)} fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="b" name={monthLabel(monthB)} fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 3. Top 5 gastos del mes */}
      <Card title={`Top 5 gastos · ${month ? monthLabel(month) : ""}`}>
        {top5.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin gastos este mes.</p>
        ) : (
          <div className="space-y-2">
            {top5.map((m, i) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-400">
                    {i + 1}
                  </span>
                  <span>
                    <span className="text-neutral-200">
                      {m.description || m.counterpart_name || "—"}
                    </span>
                    <span className="ml-2 text-xs text-neutral-500">
                      {formatDate(m.date)} · {m.category}
                    </span>
                  </span>
                </span>
                <span className="font-medium text-rose-400">
                  {formatCurrency(m.amount, m.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4. Evolución de una categoría */}
      <Card
        title="Evolución de una categoría"
        right={
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        }
      >
        {evolution.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Sin gastos en “{category}” en el período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolution} margin={{ top: 8, right: 12, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="label" stroke="#525252" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <YAxis stroke="#525252" tick={{ fill: "#a3a3a3", fontSize: 11 }} width={64} tickFormatter={kFmt} />
              <Tooltip contentStyle={CHART_TT} formatter={(v) => [formatCurrency(Number(v)), category]} />
              <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
