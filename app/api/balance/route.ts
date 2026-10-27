import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/balance
 * Mercado Pago no expone un endpoint público confiable de balance para
 * cuentas personales, así que devolvemos un balance APROXIMADO calculado
 * como la suma neta (ingresos − egresos) de los movimientos guardados.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase.from("movements").select("amount");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const balance = (data ?? []).reduce(
    (sum, m) => sum + Number(m.amount ?? 0),
    0
  );

  return NextResponse.json({
    balance,
    currency: "ARS",
    approximate: true,
    note: "Calculado desde los movimientos guardados, no desde el balance real de MP.",
  });
}
