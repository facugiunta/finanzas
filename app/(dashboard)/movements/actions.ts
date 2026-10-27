"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorize } from "@/lib/categorizer";
import type { Category, MovementType } from "@/types";

/** Verifica que haya sesión antes de cualquier escritura. */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

export type CreateState = { error?: string; ok?: boolean } | null;

/** Crea un movimiento manual (típicamente un ingreso). */
export async function createMovement(
  _prev: CreateState,
  formData: FormData
): Promise<CreateState> {
  await requireUser();

  const direction = String(formData.get("direction") ?? "in"); // in | out
  const rawAmount = Number(formData.get("amount"));
  const type = String(formData.get("type") ?? "other") as MovementType;
  const description = String(formData.get("description") ?? "").trim() || null;
  const counterpart = String(formData.get("counterpart") ?? "").trim() || null;
  const dateStr = String(formData.get("date") ?? "");
  let category = String(formData.get("category") ?? "") as Category | "";

  if (!rawAmount || rawAmount <= 0) {
    return { error: "Ingresá un monto mayor a 0." };
  }
  if (!dateStr) {
    return { error: "Elegí una fecha." };
  }

  const amount = direction === "out" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
  if (!category) {
    category = categorize({ description, counterpart_name: counterpart, type });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("movements").insert({
    mp_id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    amount,
    currency: "ARS",
    description,
    counterpart_name: counterpart,
    // Mediodía UTC para evitar corrimiento de día en zonas UTC negativas (AR = UTC−3).
    date: new Date(`${dateStr}T12:00:00.000Z`).toISOString(),
    status: "approved",
    category,
    raw_data: { source: "manual" },
  });

  if (error) return { error: error.message };

  revalidatePath("/movements");
  revalidatePath("/");
  return { ok: true };
}

/** Cambia la categoría de un movimiento (edición inline). */
export async function updateMovementCategory(id: string, category: Category) {
  await requireUser();
  const admin = createAdminClient();
  const { error } = await admin
    .from("movements")
    .update({ category })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/movements");
  revalidatePath("/");
}

/** Elimina un movimiento. */
export async function deleteMovement(id: string) {
  await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.from("movements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/movements");
  revalidatePath("/");
}
