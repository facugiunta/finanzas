import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPayments, isMercadoPagoConfigured } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

/**
 * POST /api/movements/sync
 * Trae los movimientos de los últimos 90 días desde Mercado Pago y los
 * guarda en Supabase (upsert por mp_id para no duplicar).
 */
export async function POST() {
  // 1. Verificar sesión
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Verificar que MP esté configurado
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: "Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)." },
      { status: 400 }
    );
  }

  // 3. Traer de MP
  let movements;
  try {
    movements = await fetchPayments(90);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al traer de Mercado Pago: ${message}` },
      { status: 502 }
    );
  }

  if (movements.length === 0) {
    return NextResponse.json({ synced: 0, message: "Sin movimientos nuevos." });
  }

  // 4. Upsert en Supabase (bypass RLS con service role)
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("movements")
    .upsert(movements, { onConflict: "mp_id", ignoreDuplicates: true })
    .select("mp_id");

  if (error) {
    return NextResponse.json(
      { error: `Error al guardar en Supabase: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    synced: data?.length ?? 0,
    fetched: movements.length,
    message: `Sincronización completa. ${data?.length ?? 0} movimientos nuevos.`,
  });
}
