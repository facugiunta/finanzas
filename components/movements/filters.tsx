"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, MOVEMENT_TYPES } from "@/lib/categories";

export function MovementsFilters({ defaultFrom = "" }: { defaultFrom?: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const get = (k: string) => sp.get(k) ?? "";

  // Filtros "activos" (no cuenta el rango de fecha por defecto)
  const activeCount = ["q", "type", "category", "to", "min", "max"].filter((k) =>
    sp.get(k)
  ).length;

  const [open, setOpen] = useState(activeCount > 0);

  function apply(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of ["q", "type", "category", "from", "to", "min", "max"]) {
      const v = String(formData.get(key) ?? "").trim();
      if (v) params.set(key, v);
    }
    router.push(`/movements?${params.toString()}`);
  }

  const inputCls =
    "rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40">
      {/* Encabezado compacto */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-neutral-300"
      >
        <span className="flex items-center gap-2">
          <span className={`text-neutral-500 transition-transform ${open ? "rotate-90" : ""}`}>
            ›
          </span>
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              router.push("/movements");
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Limpiar
          </span>
        )}
      </button>

      {/* Formulario */}
      {open && (
        <form
          action={apply}
          className="grid grid-cols-2 gap-3 border-t border-neutral-800 p-4 lg:grid-cols-4"
        >
          <input
            name="q"
            defaultValue={get("q")}
            placeholder="Buscar…"
            className={`${inputCls} col-span-2`}
          />
          <select name="type" defaultValue={get("type")} className={inputCls}>
            <option value="">Tipo: todos</option>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select name="category" defaultValue={get("category")} className={inputCls}>
            <option value="">Categoría: todas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Desde
            <input type="date" name="from" defaultValue={get("from") || defaultFrom} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Hasta
            <input type="date" name="to" defaultValue={get("to")} className={inputCls} />
          </label>
          <input
            type="number"
            name="min"
            defaultValue={get("min")}
            placeholder="Monto mín."
            className={inputCls}
          />
          <input
            type="number"
            name="max"
            defaultValue={get("max")}
            placeholder="Monto máx."
            className={inputCls}
          />
          <div className="col-span-2 flex gap-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => router.push("/movements")}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-900"
            >
              Limpiar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
