import type { Movement } from "@/types";

/** Un movimiento es ingreso si amount > 0, egreso si amount < 0. */
const isIncome = (m: Movement) => m.amount > 0;
const isExpense = (m: Movement) => m.amount < 0;

export interface MonthPoint {
  month: string; // etiqueta corta, ej "ago"
  key: string; // "YYYY-MM"
  ingresos: number;
  egresos: number; // positivo (valor absoluto)
}

export interface CategoryPoint {
  category: string;
  total: number; // gasto positivo
}

export interface DashboardMetrics {
  balance: number; // neto (ingresos - egresos) de TODO lo guardado
  monthIncome: number;
  monthExpense: number;
  avgDailySpend: number;
  topCategory: CategoryPoint | null;
  topDay: { date: string; total: number } | null;
  last6Months: MonthPoint[];
  monthByCategory: CategoryPoint[];
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { month: "short" }).format(date);
}

/** Serie de ingresos/egresos de los últimos 6 meses (incluye el actual). */
function last6MonthsSeries(movements: Movement[], now: Date): MonthPoint[] {
  const points: MonthPoint[] = [];
  const byKey = new Map<string, { ingresos: number; egresos: number }>();

  for (const m of movements) {
    const k = monthKey(new Date(m.date));
    const acc = byKey.get(k) ?? { ingresos: 0, egresos: 0 };
    if (isIncome(m)) acc.ingresos += m.amount;
    else acc.egresos += Math.abs(m.amount);
    byKey.set(k, acc);
  }

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    const acc = byKey.get(k) ?? { ingresos: 0, egresos: 0 };
    points.push({
      key: k,
      month: shortMonthLabel(d),
      ingresos: acc.ingresos,
      egresos: acc.egresos,
    });
  }
  return points;
}

/** "2026-08" → "agosto 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

/** Lista de meses presentes en los datos, más nuevo primero. */
export function availableMonths(
  movements: Movement[]
): { key: string; label: string }[] {
  const keys = new Set<string>();
  for (const m of movements) keys.add(monthKey(new Date(m.date)));
  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({ key, label: monthLabel(key) }));
}

/** Egresos por categoría de un mes puntual. */
export function expenseCategoriesForMonth(
  movements: Movement[],
  key: string
): CategoryPoint[] {
  return categoryBreakdown(
    movements.filter((m) => monthKey(new Date(m.date)) === key)
  );
}

/** Evolución del gasto de una categoría, mes a mes (ascendente). */
export function categoryEvolution(
  movements: Movement[],
  category: string
): { key: string; label: string; total: number }[] {
  const byMonth = new Map<string, number>();
  for (const m of movements) {
    if (!isExpense(m) || m.category !== category) continue;
    const k = monthKey(new Date(m.date));
    byMonth.set(k, (byMonth.get(k) ?? 0) + Math.abs(m.amount));
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, total]) => ({ key, label: monthLabel(key), total }));
}

/** Top N gastos individuales de un mes (por monto). */
export function topExpenses(
  movements: Movement[],
  key: string,
  n = 5
): Movement[] {
  return movements
    .filter((m) => isExpense(m) && monthKey(new Date(m.date)) === key)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, n);
}

/** Gasto por categoría (solo egresos) para un set de movimientos. */
function categoryBreakdown(movements: Movement[]): CategoryPoint[] {
  const byCat = new Map<string, number>();
  for (const m of movements) {
    if (!isExpense(m)) continue;
    byCat.set(m.category, (byCat.get(m.category) ?? 0) + Math.abs(m.amount));
  }
  return [...byCat.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/** Calcula todas las métricas del dashboard a partir de los movimientos. */
export function computeDashboard(
  movements: Movement[],
  now: Date = new Date()
): DashboardMetrics {
  const balance = movements.reduce((s, m) => s + m.amount, 0);

  const curKey = monthKey(now);
  const monthMovs = movements.filter(
    (m) => monthKey(new Date(m.date)) === curKey
  );

  const monthIncome = monthMovs
    .filter(isIncome)
    .reduce((s, m) => s + m.amount, 0);
  const monthExpense = monthMovs
    .filter(isExpense)
    .reduce((s, m) => s + Math.abs(m.amount), 0);

  // Gasto por día del mes actual
  const byDay = new Map<string, number>();
  for (const m of monthMovs) {
    if (!isExpense(m)) continue;
    const dayKey = new Date(m.date).toISOString().slice(0, 10);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + Math.abs(m.amount));
  }
  let topDay: DashboardMetrics["topDay"] = null;
  for (const [date, total] of byDay) {
    if (!topDay || total > topDay.total) topDay = { date, total };
  }

  const daysElapsed = now.getDate();
  const avgDailySpend = daysElapsed > 0 ? monthExpense / daysElapsed : 0;

  const monthByCategory = categoryBreakdown(monthMovs);
  const topCategory = monthByCategory[0] ?? null;

  return {
    balance,
    monthIncome,
    monthExpense,
    avgDailySpend,
    topCategory,
    topDay,
    last6Months: last6MonthsSeries(movements, now),
    monthByCategory,
  };
}
