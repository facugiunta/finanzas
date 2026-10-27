"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AlertType } from "@/lib/alerts";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

export type AlertState = { error?: string; ok?: boolean } | null;

export async function createAlert(
  _prev: AlertState,
  formData: FormData
): Promise<AlertState> {
  await requireUser();

  const type = String(formData.get("type") ?? "") as AlertType;
  const threshold = Number(formData.get("threshold"));
  const category = String(formData.get("category") ?? "").trim() || null;

  if (!type) return { error: "Elegí un tipo de alerta." };
  if (!threshold || threshold <= 0) return { error: "Ingresá un monto válido." };
  if (type === "category_month" && !category)
    return { error: "Elegí una categoría." };

  const admin = createAdminClient();
  const { error } = await admin.from("alerts").insert({
    type,
    threshold,
    category: type === "category_month" ? category : null,
    enabled: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/alerts");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteAlert(id: string) {
  await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.from("alerts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/alerts");
  revalidatePath("/");
}

export async function toggleAlert(id: string, enabled: boolean) {
  await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.from("alerts").update({ enabled }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/alerts");
  revalidatePath("/");
}
