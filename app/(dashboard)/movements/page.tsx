import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MovementsFilters } from "@/components/movements/filters";
import { MovementsTable } from "@/components/movements/movements-table";
import { AddMovementForm } from "@/components/movements/add-movement-form";
import type { Movement } from "@/types";

const PAGE_SIZE = 25;

type SP = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const from = one(searchParams.from);
  const to = one(searchParams.to);
  const type = one(searchParams.type);
  const category = one(searchParams.category);
  const q = one(searchParams.q);
  const min = one(searchParams.min);
  const max = one(searchParams.max);
  const page = Math.max(Number(one(searchParams.page) || "1"), 1);

  // Por defecto se muestra solo el último mes (últimos 30 días).
  const defaultFrom = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const effectiveFrom = from || defaultFrom;
  const usingDefaultRange = !from;

  let movements: Movement[] = [];
  let tableMissing = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    let query = supabase
      .from("movements")
      .select("*")
      .order("date", { ascending: false });
    query = query.gte("date", effectiveFrom);
    if (to) query = query.lte("date", to);
    if (type) query = query.eq("type", type);
    if (category) query = query.eq("category", category);
    if (q) query = query.or(`description.ilike.%${q}%,counterpart_name.ilike.%${q}%`);

    const { data, error } = await query;
    tableMissing = error?.code === "42P01" || error?.code === "PGRST205";
    movements = (data as Movement[]) ?? [];
  }

  // Filtro por magnitud de monto (en JS, sobre valor absoluto)
  const minN = min ? Number(min) : null;
  const maxN = max ? Number(max) : null;
  const filtered = movements.filter((m) => {
    const abs = Math.abs(m.amount);
    if (minN !== null && abs < minN) return false;
    if (maxN !== null && abs > maxN) return false;
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  // Query string para export y paginación (sin `page`)
  const baseParams = new URLSearchParams();
  for (const [k, v] of Object.entries({
    from: effectiveFrom,
    to,
    type,
    category,
    q,
    min,
    max,
  })) {
    if (v) baseParams.set(k, v);
  }
  const exportHref = `/api/movements/export?${baseParams.toString()}`;
  const pageHref = (p: number) => {
    const pp = new URLSearchParams(baseParams);
    pp.set("page", String(p));
    return `/movements?${pp.toString()}`;
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {total} movimiento{total === 1 ? "" : "s"}
            {usingDefaultRange && " · último mes (ajustá el filtro de fecha para ver más)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportHref}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-900"
          >
            Exportar CSV
          </a>
        </div>
      </header>

      <AddMovementForm />

      {tableMissing ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          La tabla <code>movements</code> no existe. Corré la migración.
        </div>
      ) : (
        <>
          <MovementsFilters defaultFrom={defaultFrom} />
          <MovementsTable movements={pageRows} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">
                Página {current} de {totalPages}
              </span>
              <div className="flex gap-2">
                {current > 1 && (
                  <Link
                    href={pageHref(current - 1)}
                    className="rounded-lg border border-neutral-800 px-3 py-1.5 hover:bg-neutral-900"
                  >
                    ← Anterior
                  </Link>
                )}
                {current < totalPages && (
                  <Link
                    href={pageHref(current + 1)}
                    className="rounded-lg border border-neutral-800 px-3 py-1.5 hover:bg-neutral-900"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
