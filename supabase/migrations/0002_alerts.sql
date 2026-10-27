-- ─────────────────────────────────────────────────────────────
-- Tabla: alerts  (configuración de alertas de gasto)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.alerts (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,            -- daily_spend | category_month | single_movement
  threshold   numeric(14,2) not null,   -- umbral en pesos
  category    text,                     -- solo para category_month
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.alerts enable row level security;

drop policy if exists "authenticated can read alerts" on public.alerts;
create policy "authenticated can read alerts"
  on public.alerts for select to authenticated using (true);
