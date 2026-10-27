import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TYPE_LABELS } from "@/lib/categories";
import type { Movement } from "@/types";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * GET /api/movements/export  — descarga CSV de los movimientos filtrados.
 * Query params: from, to, type, category, q, min, max.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  let query = supabase
    .from("movements")
    .select("*")
    .order("date", { ascending: false });

  if (sp.get("from")) query = query.gte("date", sp.get("from")!);
  if (sp.get("to")) query = query.lte("date", sp.get("to")!);
  if (sp.get("type")) query = query.eq("type", sp.get("type")!);
  if (sp.get("category")) query = query.eq("category", sp.get("category")!);
  if (sp.get("q"))
    query = query.or(
      `description.ilike.%${sp.get("q")}%,counterpart_name.ilike.%${sp.get("q")}%`
    );

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const min = sp.get("min") ? Number(sp.get("min")) : null;
  const max = sp.get("max") ? Number(sp.get("max")) : null;
  const rows = (data as Movement[]).filter((m) => {
    const abs = Math.abs(m.amount);
    if (min !== null && abs < min) return false;
    if (max !== null && abs > max) return false;
    return true;
  });

  const header = [
    "Fecha",
    "Tipo",
    "Descripción",
    "Contraparte",
    "Categoría",
    "Monto",
    "Moneda",
    "Estado",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const m of rows) {
    lines.push(
      [
        m.date,
        TYPE_LABELS[m.type] ?? m.type,
        m.description ?? "",
        m.counterpart_name ?? "",
        m.category,
        m.amount,
        m.currency,
        m.status,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const csv = "﻿" + lines.join("\r\n"); // BOM para Excel

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="movimientos_${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
