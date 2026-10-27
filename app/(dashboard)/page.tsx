import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { IncomeExpenseBar } from "@/components/charts/income-expense-bar";
import { CategoryPie } from "@/components/charts/category-pie";
import { computeDashboard } from "@/lib/metrics";
import { evaluateAlerts, type Alert } from "@/lib/alerts";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Movement } from "@/types";

async function getAlerts(): Promise<Alert[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("alerts").select("*");
  return (data as Alert[]) ?? [];
}

async function getMovements(): Promise<{
  movements: Movement[];
  tableMissing: boolean;
}> {
  if (!isSupabaseConfigured()) return { movements: [], tableMissing: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .order("date", { ascending: false });

  const tableMissing = error?.code === "42P01" || error?.code === "PGRST205";
  return { movements: (data as Movement[]) ?? [], tableMissing };
}

function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "income" | "expense";
}) {
  const valueColor =
    tone === "income"
      ? "text-emerald-400"
      : tone === "expense"
        ? "text-rose-400"
        : "text-neutral-100";
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const { movements, tableMissing } = await getMovements();
  const alerts = await getAlerts();
  const triggered = evaluateAlerts(alerts, movements);
  const m = computeDashboard(movements);
  const hasData = movements.length > 0;
  const latest = movements.slice(0, 10);

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Resumen de tus finanzas personales
          </p>
        </div>
      </header>

      {triggered.length > 0 && (
        <div className="mb-6 space-y-2">
          {triggered.map((t) => (
            <div
              key={t.alert.id}
              className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
            >
              <span>⚠ {t.message}</span>
              <span className="font-semibold">{formatCurrency(t.current)}</span>
            </div>
          ))}
        </div>
      )}

      {tableMissing && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          La tabla <code className="rounded bg-neutral-800 px-1.5 py-0.5">movements</code>{" "}
          todavía no existe. Corré la migración{" "}
          <code className="rounded bg-neutral-800 px-1.5 py-0.5">
            supabase/migrations/0001_movements.sql
          </code>
          .
        </div>
      )}

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Balance (aprox.)"
          value={formatCurrency(m.balance)}
          hint="Neto de movimientos guardados"
        />
        <MetricCard
          label="Ingresos del mes"
          value={formatCurrency(m.monthIncome)}
          tone="income"
        />
        <MetricCard
          label="Egresos del mes"
          value={formatCurrency(m.monthExpense)}
          tone="expense"
        />
        <MetricCard
          label="Gasto promedio diario"
          value={formatCurrency(m.avgDailySpend)}
          hint="Mes actual"
        />
        <MetricCard
          label="Categoría con más gasto"
          value={m.topCategory ? m.topCategory.category : "—"}
          hint={m.topCategory ? formatCurrency(m.topCategory.total) : undefined}
        />
        <MetricCard
          label="Día con más gasto"
          value={m.topDay ? formatDate(m.topDay.date) : "—"}
          hint={m.topDay ? formatCurrency(m.topDay.total) : undefined}
        />
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">
            Ingresos vs egresos (últimos 6 meses)
          </h2>
          <IncomeExpenseBar data={m.last6Months} />
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">
            Gastos por categoría (mes actual)
          </h2>
          <CategoryPie data={m.monthByCategory} />
        </div>
      </div>

      {/* Últimos movimientos */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Últimos movimientos</h2>
        {!hasData ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-500">
            {tableMissing
              ? "Creá la tabla para empezar."
              : "No hay movimientos todavía. Agregalos desde la pantalla de Movimientos."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900/60 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((mv) => (
                  <tr
                    key={mv.id}
                    className="border-t border-neutral-800 hover:bg-neutral-900/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-400">
                      {formatDate(mv.date)}
                    </td>
                    <td className="px-4 py-3">
                      {mv.counterpart_name || mv.description || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-neutral-400 sm:table-cell">
                      {mv.category}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                        mv.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(mv.amount, mv.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
