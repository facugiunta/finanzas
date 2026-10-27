-- ─────────────────────────────────────────────────────────────
-- Tabla: movements
-- Guarda los movimientos traídos de Mercado Pago.
-- App de un solo usuario → sin columna user_id.
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.movements (
  id                uuid primary key default gen_random_uuid(),
  mp_id             text not null unique,           -- ID del movimiento en MP (evita duplicados)
  type              text not null default 'other',  -- transfer_in, transfer_out, qr_payment, link_payment, service_payment, extraction, recharge, other
  amount            numeric(14,2) not null,         -- positivo = ingreso, negativo = egreso
  currency          text not null default 'ARS',    -- ARS, USD
  description       text,
  counterpart_name  text,                           -- nombre de quien envió/recibió
  date              timestamptz not null,
  status            text not null default 'approved',
  raw_data          jsonb,                          -- respuesta cruda de MP
  category          text not null default 'Otros',
  created_at        timestamptz not null default now()
);

-- Índices para filtros y orden habituales
create index if not exists movements_date_idx     on public.movements (date desc);
create index if not exists movements_category_idx on public.movements (category);
create index if not exists movements_type_idx     on public.movements (type);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Los INSERT/UPSERT del sync se hacen con la service_role key
-- (bypassea RLS). La lectura la hace el usuario autenticado.
-- ─────────────────────────────────────────────────────────────
alter table public.movements enable row level security;

drop policy if exists "authenticated can read movements" on public.movements;
create policy "authenticated can read movements"
  on public.movements
  for select
  to authenticated
  using (true);

-- El usuario autenticado puede editar la categoría manualmente (paso 5)
drop policy if exists "authenticated can update movements" on public.movements;
create policy "authenticated can update movements"
  on public.movements
  for update
  to authenticated
  using (true)
  with check (true);
