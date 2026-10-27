"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createAlert,
  deleteAlert,
  toggleAlert,
  type AlertState,
} from "@/app/(dashboard)/alerts/actions";
import { ALERT_TYPE_LABELS, type Alert, type AlertType } from "@/lib/alerts";
import { CATEGORIES } from "@/lib/categories";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/components/ui/toast";

const inputCls =
  "rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";

function AddBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Crear alerta"}
    </button>
  );
}

function alertText(a: Alert): string {
  const base = ALERT_TYPE_LABELS[a.type];
  if (a.type === "category_month") {
    return `${base} (${a.category}) ${formatCurrency(a.threshold)}`;
  }
  return `${base} ${formatCurrency(a.threshold)}`;
}

export function AlertsManager({
  alerts,
  triggeredIds,
}: {
  alerts: Alert[];
  triggeredIds: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [type, setType] = useState<AlertType>("daily_spend");
  const [state, formAction] = useFormState<AlertState, FormData>(createAlert, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setType("daily_spend");
      router.refresh();
      toast("Alerta creada", "success");
    }
  }, [state, router, toast]);

  return (
    <div className="space-y-6">
      {/* Form nueva alerta */}
      <form
        ref={formRef}
        action={formAction}
        className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"
      >
        <h2 className="mb-4 text-sm font-medium text-neutral-300">Nueva alerta</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Tipo
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as AlertType)}
              className={inputCls}
            >
              <option value="daily_spend">Gasto diario</option>
              <option value="category_month">Gasto mensual por categoría</option>
              <option value="single_movement">Movimiento individual</option>
            </select>
          </label>

          {type === "category_month" && (
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Categoría
              <select name="category" className={inputCls} defaultValue="Comida y delivery">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Supera ($)
            <input
              name="threshold"
              type="number"
              min="0"
              step="100"
              placeholder="Ej: 50000"
              required
              className={inputCls}
            />
          </label>

          <AddBtn />
        </div>
        {state?.error && (
          <p className="mt-3 text-sm text-rose-400">{state.error}</p>
        )}
      </form>

      {/* Lista de alertas */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">
          Tus alertas ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-500">
            No tenés alertas configuradas. Creá una arriba.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => {
              const isTriggered = triggeredIds.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`flex items-center justify-between rounded-xl border p-4 ${
                    isTriggered
                      ? "border-rose-500/40 bg-rose-500/10"
                      : "border-neutral-800 bg-neutral-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${a.enabled ? "" : "text-neutral-600 line-through"}`}>
                      {alertText(a)}
                    </span>
                    {isTriggered && (
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400">
                        activa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        toggleAlert(a.id, !a.enabled).then(() => {
                          router.refresh();
                          toast(a.enabled ? "Alerta desactivada" : "Alerta activada", "info");
                        });
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-300"
                    >
                      {a.enabled ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar esta alerta?"))
                          deleteAlert(a.id).then(() => {
                            router.refresh();
                            toast("Alerta eliminada", "success");
                          });
                      }}
                      className="text-neutral-600 hover:text-rose-400"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
