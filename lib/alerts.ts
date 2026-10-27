import type { Movement } from "@/types";

export type AlertType = "daily_spend" | "category_month" | "single_movement";

export interface Alert {
  id: string;
  type: AlertType;
  threshold: number;
  category: string | null;
  enabled: boolean;
  created_at: string;
}

export interface TriggeredAlert {
  alert: Alert;
  current: number;
  message: string;
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  daily_spend: "Gasto diario supera",
  category_month: "Gasto mensual en categoría supera",
  single_movement: "Movimiento individual supera",
};

const isExpense = (m: Movement) => m.amount < 0;

/** Clave de fecha en horario argentino: "YYYY-MM-DD". */
function arDateKey(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

/** Evalúa las alertas activas contra los movimientos. Devuelve las disparadas. */
export function evaluateAlerts(
  alerts: Alert[],
  movements: Movement[],
  now: Date = new Date()
): TriggeredAlert[] {
  const todayKey = arDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  const triggered: TriggeredAlert[] = [];

  for (const alert of alerts) {
    if (!alert.enabled) continue;

    if (alert.type === "daily_spend") {
      const total = movements
        .filter((m) => isExpense(m) && arDateKey(m.date) === todayKey)
        .reduce((s, m) => s + Math.abs(m.amount), 0);
      if (total > alert.threshold) {
        triggered.push({
          alert,
          current: total,
          message: `Hoy gastaste más de lo previsto.`,
        });
      }
    } else if (alert.type === "category_month") {
      const total = movements
        .filter(
          (m) =>
            isExpense(m) &&
            arDateKey(m.date).slice(0, 7) === monthKey &&
            m.category === alert.category
        )
        .reduce((s, m) => s + Math.abs(m.amount), 0);
      if (total > alert.threshold) {
        triggered.push({
          alert,
          current: total,
          message: `Gasto del mes en ${alert.category} por encima del límite.`,
        });
      }
    } else if (alert.type === "single_movement") {
      const big = movements.filter(
        (m) =>
          isExpense(m) &&
          arDateKey(m.date).slice(0, 7) === monthKey &&
          Math.abs(m.amount) > alert.threshold
      );
      if (big.length > 0) {
        const max = Math.max(...big.map((m) => Math.abs(m.amount)));
        triggered.push({
          alert,
          current: max,
          message: `${big.length} movimiento(s) del mes superan el límite.`,
        });
      }
    }
  }

  return triggered;
}
