import type { Movement } from "@/types";

const isExpense = (m: Movement) => m.amount < 0;

/** "YYYY-MM-DD" en horario argentino. */
function arDateKey(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export interface ProjectionPoint {
  day: number;
  real: number | null; // gasto acumulado real (null después de hoy)
  proyeccion: number; // proyección lineal al ritmo actual
}

export interface Projection {
  balance: number;
  dailyRate: number; // promedio diario últimos 90 días
  paceDaily: number; // ritmo del mes actual (gastado / días transcurridos)
  daysElapsed: number;
  daysInMonth: number;
  spentSoFar: number;
  projectedMonthSpend: number;
  daysToDeplete: number | null;
  projectedEndBalance: number;
  series: ProjectionPoint[];
  hasData: boolean;
}

export function computeProjection(
  movements: Movement[],
  now: Date = new Date()
): Projection {
  const balance = movements.reduce((s, m) => s + m.amount, 0);

  const todayKey = arDateKey(now);
  const [year, month, dayStr] = todayKey.split("-");
  const monthKey = `${year}-${month}`;
  const daysElapsed = Number(dayStr);
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  // Promedio diario de los últimos 90 días
  const since = new Date(now.getTime() - 90 * 86400000);
  const last90 = movements.filter(
    (m) => isExpense(m) && new Date(m.date) >= since
  );
  const last90Total = last90.reduce((s, m) => s + Math.abs(m.amount), 0);
  const dailyRate = last90Total / 90;

  // Gasto del mes actual por día
  const byDay = new Map<number, number>();
  let spentSoFar = 0;
  for (const m of movements) {
    if (!isExpense(m)) continue;
    const k = arDateKey(m.date);
    if (k.slice(0, 7) !== monthKey) continue;
    const d = Number(k.slice(8, 10));
    byDay.set(d, (byDay.get(d) ?? 0) + Math.abs(m.amount));
    spentSoFar += Math.abs(m.amount);
  }

  const paceDaily = daysElapsed > 0 ? spentSoFar / daysElapsed : 0;
  const projectedMonthSpend = paceDaily * daysInMonth;
  const daysToDeplete =
    balance > 0 && dailyRate > 0 ? Math.floor(balance / dailyRate) : null;
  const projectedEndBalance =
    balance - paceDaily * (daysInMonth - daysElapsed);

  // Serie acumulada real vs proyección
  const series: ProjectionPoint[] = [];
  let cum = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (d <= daysElapsed) cum += byDay.get(d) ?? 0;
    series.push({
      day: d,
      real: d <= daysElapsed ? cum : null,
      proyeccion: Math.round(paceDaily * d),
    });
  }

  return {
    balance,
    dailyRate,
    paceDaily,
    daysElapsed,
    daysInMonth,
    spentSoFar,
    projectedMonthSpend,
    daysToDeplete,
    projectedEndBalance,
    series,
    hasData: movements.length > 0,
  };
}
