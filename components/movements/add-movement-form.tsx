"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { CATEGORIES, MOVEMENT_TYPES } from "@/lib/categories";
import { createMovement, type CreateState } from "@/app/(dashboard)/movements/actions";
import { useToast } from "@/components/ui/toast";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export function AddMovementForm() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<CreateState, FormData>(createMovement, null);
  const formRef = useRef<HTMLFormElement>(null);
  // Fecha local (no UTC) para que el default sea el día correcto en AR.
  const today = new Date().toLocaleDateString("sv-SE"); // formato YYYY-MM-DD

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
      toast("Movimiento agregado", "success");
    }
  }, [state, router, toast]);

  const inputCls =
    "rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-900"
      >
        + Agregar movimiento
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Nuevo movimiento</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <select name="direction" defaultValue="in" className={inputCls}>
          <option value="in">Ingreso (+)</option>
          <option value="out">Egreso (−)</option>
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Monto"
          required
          className={inputCls}
        />
        <input name="date" type="date" defaultValue={today} className={inputCls} />
        <select name="type" defaultValue="transfer_in" className={inputCls}>
          {MOVEMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select name="category" defaultValue="Cobros / ingresos" className={inputCls}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input name="counterpart" placeholder="Contraparte (opcional)" className={inputCls} />
        <input
          name="description"
          placeholder="Descripción (opcional)"
          className={`${inputCls} col-span-2 md:col-span-3`}
        />
      </div>

      {state?.error && (
        <p className="mt-3 text-sm text-rose-400">{state.error}</p>
      )}

      <div className="mt-3">
        <SubmitBtn />
      </div>
    </form>
  );
}
