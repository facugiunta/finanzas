import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AlertsManager } from "@/components/alerts/alerts-manager";
import { evaluateAlerts, type Alert } from "@/lib/alerts";
import type { Movement } from "@/types";

export default async function AlertsPage() {
  let alerts: Alert[] = [];
  let movements: Movement[] = [];
  let tableMissing = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [alertsRes, movsRes] = await Promise.all([
      supabase.from("alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("movements").select("*"),
    ]);
    const code = alertsRes.error?.code;
    tableMissing = code === "42P01" || code === "PGRST205";
    alerts = (alertsRes.data as Alert[]) ?? [];
    movements = (movsRes.data as Movement[]) ?? [];
  }

  const triggered = evaluateAlerts(alerts, movements);
  const triggeredIds = triggered.map((t) => t.alert.id);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Configurá avisos de gasto. Las alertas activas aparecen en el dashboard.
        </p>
      </header>

      {tableMissing ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-300">
          <p className="font-medium">Falta crear la tabla de alertas</p>
          <p className="mt-1 text-amber-300/80">
            Pegá esto en el SQL Editor de Supabase y recargá esta página:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-950 p-3 text-xs text-neutral-300">
{`create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  threshold numeric(14,2) not null,
  category text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.alerts enable row level security;
create policy "authenticated can read alerts"
  on public.alerts for select to authenticated using (true);`}
          </pre>
        </div>
      ) : (
        <AlertsManager alerts={alerts} triggeredIds={triggeredIds} />
      )}
    </div>
  );
}
