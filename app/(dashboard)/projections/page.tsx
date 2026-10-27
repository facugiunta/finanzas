import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { computeProjection } from "@/lib/projections";
import { ProjectionChart } from "@/components/projections/projection-chart";
import { formatCurrency } from "@/lib/formatters";
import type { Movement } from "@/types";

function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : "text-neutral-100";
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}

export default async function ProjectionsPage() {
  let movements: Movement[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("movements").select("*");
    movements = (data as Movement[]) ?? [];
  }

  const p = computeProjection(movements);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Proyecciones</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Estimación basada en tu ritmo de gasto
        </p>
      </header>

      {!p.hasData ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-500">
          Cargá movimientos para ver proyecciones.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Gasto proyectado del mes"
              value={formatCurrency(p.projectedMonthSpend)}
              hint={`Al ritmo actual (${formatCurrency(p.paceDaily)}/día)`}
              tone="bad"
            />
            <Metric
              label="Gastado hasta hoy"
              value={formatCurrency(p.spentSoFar)}
              hint={`Día ${p.daysElapsed} de ${p.daysInMonth}`}
            />
            <Metric
              label="Balance proyectado a fin de mes"
              value={formatCurrency(p.projectedEndBalance)}
              tone={p.projectedEndBalance >= 0 ? "good" : "bad"}
            />
            <Metric
              label="Días hasta agotar balance"
              value={p.daysToDeplete !== null ? `${p.daysToDeplete} días` : "—"}
              hint={
                p.daysToDeplete !== null
                  ? `Ritmo ${formatCurrency(p.dailyRate)}/día (90 días)`
                  : "Balance no positivo o sin gasto"
              }
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="mb-4 text-sm font-medium text-neutral-300">
              Gasto acumulado real vs proyección (mes actual)
            </h2>
            <ProjectionChart data={p.series} />
          </div>

          <p className="text-xs text-neutral-600">
            La proyección asume que seguís gastando al mismo ritmo promedio del
            mes. El balance es el neto de los movimientos cargados (no el saldo
            real de Mercado Pago).
          </p>
        </div>
      )}
    </div>
  );
}
