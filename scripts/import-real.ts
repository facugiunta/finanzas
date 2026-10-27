// Importación histórica real usando el código canónico de la app.
// Uso: npx tsx scripts/import-real.ts [dias]
import { readFileSync } from "node:fs";

// Cargar .env.local antes de invocar cualquier función que lea process.env
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

import { fetchMercadoPagoEmails } from "@/lib/gmail";
import { parseMercadoPagoEmail } from "@/lib/mail-parser";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MovementInsert } from "@/lib/mercadopago";

const days = Number(process.argv[2] ?? 1000);

async function main() {
  const admin = createAdminClient();

  // 1. Limpiar datos demo
  const del = await admin.from("movements").delete().like("mp_id", "demo_%");
  if (del.error) console.log("Aviso al limpiar demo:", del.error.message);
  else console.log("Datos demo eliminados.");

  // 2. Leer y parsear mails (código canónico)
  console.log(`Leyendo mails de MP (últimos ${days} días)…`);
  const emails = await fetchMercadoPagoEmails(days);
  const movements: MovementInsert[] = [];
  for (const e of emails) {
    const mv = parseMercadoPagoEmail(e);
    if (mv) movements.push(mv);
  }
  console.log(`Mails leídos: ${emails.length} | Movimientos parseados: ${movements.length}`);

  // 3. Upsert
  const { data, error } = await admin
    .from("movements")
    .upsert(movements, { onConflict: "mp_id", ignoreDuplicates: true })
    .select("mp_id");

  if (error) {
    console.log("ERROR al guardar:", error.message);
    process.exit(1);
  }
  console.log(`Insertados/actualizados: ${data?.length ?? 0}`);

  // 4. Resumen por categoría
  const { data: all } = await admin.from("movements").select("category, amount");
  const byCat: Record<string, number> = {};
  let ingresos = 0, egresos = 0;
  for (const r of all ?? []) {
    const amt = Number(r.amount);
    if (amt >= 0) ingresos += amt; else egresos += Math.abs(amt);
    if (amt < 0) byCat[r.category] = (byCat[r.category] ?? 0) + Math.abs(amt);
  }
  console.log(`\nTotal filas: ${all?.length}`);
  console.log(`Ingresos: $${ingresos.toLocaleString("es-AR")} | Egresos: $${egresos.toLocaleString("es-AR")}`);
  console.log("Gasto por categoría:");
  for (const [c, v] of Object.entries(byCat).sort((a, b) => b[1] - a[1]))
    console.log(`  ${c.padEnd(28)} $${v.toLocaleString("es-AR")}`);
}

main().then(() => process.exit(0));
