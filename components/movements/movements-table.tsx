"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, TYPE_LABELS } from "@/lib/categories";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { updateMovementCategory, deleteMovement } from "@/app/(dashboard)/movements/actions";
import { useToast } from "@/components/ui/toast";
import type { Category, Movement } from "@/types";

export function MovementsTable({ movements }: { movements: Movement[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function onCategoryChange(id: string, category: Category) {
    startTransition(async () => {
      try {
        await updateMovementCategory(id, category);
        router.refresh();
        toast("Categoría actualizada", "success");
      } catch {
        toast("No se pudo actualizar la categoría", "error");
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    startTransition(async () => {
      try {
        await deleteMovement(id);
        router.refresh();
        toast("Movimiento eliminado", "success");
      } catch {
        toast("No se pudo eliminar", "error");
      }
    });
  }

  if (movements.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-500">
        No hay movimientos que coincidan con los filtros.
      </div>
    );
  }

  const label = (m: Movement) =>
    m.counterpart_name || m.description || "—";

  return (
    <>
      {/* ── Desktop: tabla ── */}
      <div
        className={`hidden overflow-x-auto rounded-2xl border border-neutral-800 md:block ${
          pending ? "opacity-60" : ""
        }`}
      >
        <table className="w-full text-sm">
          <thead className="bg-neutral-900/60 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Descripción</th>
              <th className="px-4 py-3 font-medium">Contraparte</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Monto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-t border-neutral-800 hover:bg-neutral-900/40">
                <td className="whitespace-nowrap px-4 py-3 text-neutral-400">
                  {formatDate(m.date)}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3" title={m.description ?? ""}>
                  {m.description || "—"}
                </td>
                <td className="max-w-[160px] truncate px-4 py-3 text-neutral-400" title={m.counterpart_name ?? ""}>
                  {m.counterpart_name || "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.category}
                    onChange={(e) => onCategoryChange(m.id, e.target.value as Category)}
                    className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-300 outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                  {TYPE_LABELS[m.type] ?? m.type}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                    m.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(m.amount, m.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(m.id)}
                    className="text-neutral-600 transition hover:text-rose-400"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: lista expandible ── */}
      <div className={`space-y-2 md:hidden ${pending ? "opacity-60" : ""}`}>
        {movements.map((m) => {
          const open = expandedId === m.id;
          return (
            <div
              key={m.id}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40"
            >
              <button
                onClick={() => setExpandedId(open ? null : m.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`text-neutral-500 transition-transform ${open ? "rotate-90" : ""}`}
                  >
                    ›
                  </span>
                  <span className="truncate text-sm text-neutral-100">{label(m)}</span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    m.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(m.amount, m.currency)}
                </span>
              </button>

              {open && (
                <div className="space-y-3 border-t border-neutral-800 p-4 text-sm">
                  <Detail label="Fecha" value={formatDateTime(m.date)} />
                  <Detail label="Descripción" value={m.description || "—"} />
                  <Detail label="Contraparte" value={m.counterpart_name || "—"} />
                  <Detail label="Tipo" value={TYPE_LABELS[m.type] ?? m.type} />
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Categoría</span>
                    <select
                      value={m.category}
                      onChange={(e) => onCategoryChange(m.id, e.target.value as Category)}
                      className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => onDelete(m.id)}
                    className="w-full rounded-lg border border-neutral-800 py-2 text-sm text-neutral-400 hover:border-rose-500/40 hover:text-rose-400"
                  >
                    Eliminar movimiento
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className="truncate text-right text-neutral-200">{value}</span>
    </div>
  );
}
