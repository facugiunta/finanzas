// Datos de ejemplo para capturas / demo.
//
//   node scripts/seed-demo.mjs backup    -> guarda tus datos reales en .local-backup.json
//   node scripts/seed-demo.mjs demo      -> (hace backup si falta) reemplaza todo por datos de ejemplo
//   node scripts/seed-demo.mjs restore   -> restaura tus datos reales y borra el backup
//
// Pensado para sacar capturas con datos inventados sin perder los reales.
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync("./.env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BACKUP = ".local-backup.json";
const cmd = process.argv[2] ?? "demo";

async function backup() {
  const movs = await supabase.from("movements").select("*");
  const alerts = await supabase.from("alerts").select("*");
  if (movs.error) throw new Error(movs.error.message);
  writeFileSync(
    BACKUP,
    JSON.stringify({ movements: movs.data, alerts: alerts.data ?? [] }, null, 2)
  );
  console.log(`Backup OK -> ${BACKUP} (${movs.data.length} movimientos, ${alerts.data?.length ?? 0} alertas)`);
}

async function wipe() {
  await supabase.from("movements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

async function restore() {
  if (!existsSync(BACKUP)) { console.log("No hay backup para restaurar."); process.exit(1); }
  const { movements, alerts } = JSON.parse(readFileSync(BACKUP, "utf8"));
  await wipe();
  if (movements.length) await supabase.from("movements").insert(movements);
  if (alerts?.length) await supabase.from("alerts").insert(alerts);
  rmSync(BACKUP);
  console.log(`Restaurado: ${movements.length} movimientos, ${alerts?.length ?? 0} alertas. Backup borrado.`);
}

const iso = (d) => new Date(Date.now() - d * 86400000).toISOString();

// Datos de ejemplo (inventados). amount: + ingreso, - egreso.
const DEMO = [
  // Sueldo mensual
  { d: 3,  a: 1250000, t: "transfer_in", desc: "Sueldo", who: "Tech Corp SA", c: "Cobros / ingresos" },
  { d: 33, a: 1250000, t: "transfer_in", desc: "Sueldo", who: "Tech Corp SA", c: "Cobros / ingresos" },
  { d: 63, a: 1180000, t: "transfer_in", desc: "Sueldo", who: "Tech Corp SA", c: "Cobros / ingresos" },
  // Freelance / otros ingresos
  { d: 18, a: 320000, t: "transfer_in", desc: "Proyecto freelance", who: "Estudio Delta", c: "Cobros / ingresos" },
  { d: 52, a: 85000,  t: "transfer_in", desc: "Venta MercadoLibre", who: "Comprador ML", c: "Cobros / ingresos" },
  { d: 10, a: 40000,  t: "transfer_in", desc: "Transferencia recibida", who: "Martina Rossi", c: "Transferencias personales" },
  // Alquiler (recurrente, grande)
  { d: 5,  a: -420000, t: "transfer_out", desc: "Alquiler", who: "Inmobiliaria Centro", c: "Otros" },
  { d: 35, a: -420000, t: "transfer_out", desc: "Alquiler", who: "Inmobiliaria Centro", c: "Otros" },
  { d: 65, a: -400000, t: "transfer_out", desc: "Alquiler", who: "Inmobiliaria Centro", c: "Otros" },
  // Servicios (recurrentes)
  { d: 6,  a: -8990,  t: "service_payment", desc: "Netflix", who: "Netflix", c: "Servicios" },
  { d: 36, a: -8990,  t: "service_payment", desc: "Netflix", who: "Netflix", c: "Servicios" },
  { d: 6,  a: -6500,  t: "service_payment", desc: "Spotify Premium", who: "Spotify", c: "Servicios" },
  { d: 12, a: -54000, t: "service_payment", desc: "Edenor (luz)", who: "Edenor", c: "Servicios" },
  { d: 42, a: -51000, t: "service_payment", desc: "Edenor (luz)", who: "Edenor", c: "Servicios" },
  { d: 15, a: -38000, t: "service_payment", desc: "Movistar (celular)", who: "Movistar", c: "Servicios" },
  { d: 20, a: -29000, t: "service_payment", desc: "Fibertel (internet)", who: "Fibertel", c: "Servicios" },
  // Salud
  { d: 8,  a: -62000, t: "service_payment", desc: "OSDE (obra social)", who: "OSDE", c: "Salud" },
  { d: 38, a: -62000, t: "service_payment", desc: "OSDE (obra social)", who: "OSDE", c: "Salud" },
  { d: 22, a: -14300, t: "qr_payment", desc: "Farmacity", who: "Farmacity", c: "Salud" },
  // Comida y delivery
  { d: 1,  a: -13500, t: "qr_payment", desc: "PedidosYa", who: "PedidosYa", c: "Comida y delivery" },
  { d: 4,  a: -9200,  t: "qr_payment", desc: "McDonald's", who: "Arcos Dorados", c: "Comida y delivery" },
  { d: 7,  a: -42000, t: "qr_payment", desc: "Supermercado Dia", who: "Supermercados Dia", c: "Comida y delivery" },
  { d: 14, a: -18700, t: "qr_payment", desc: "Rappi", who: "Rappi", c: "Comida y delivery" },
  { d: 19, a: -5400,  t: "qr_payment", desc: "Starbucks", who: "Starbucks", c: "Comida y delivery" },
  { d: 28, a: -51000, t: "qr_payment", desc: "Carrefour", who: "Carrefour", c: "Comida y delivery" },
  { d: 44, a: -16000, t: "qr_payment", desc: "PedidosYa", who: "PedidosYa", c: "Comida y delivery" },
  // Transporte
  { d: 2,  a: -4800,  t: "qr_payment", desc: "Uber", who: "Uber", c: "Transporte" },
  { d: 9,  a: -20000, t: "service_payment", desc: "Carga SUBE", who: "SUBE", c: "Transporte" },
  { d: 24, a: -38000, t: "qr_payment", desc: "YPF (nafta)", who: "YPF", c: "Transporte" },
  { d: 41, a: -6200,  t: "qr_payment", desc: "Cabify", who: "Cabify", c: "Transporte" },
  // Compras online
  { d: 11, a: -78000, t: "qr_payment", desc: "MercadoLibre", who: "MercadoLibre", c: "Compras online" },
  { d: 30, a: -45000, t: "qr_payment", desc: "Amazon", who: "Amazon", c: "Compras online" },
  { d: 55, a: -32000, t: "qr_payment", desc: "MercadoLibre", who: "MercadoLibre", c: "Compras online" },
  // Entretenimiento
  { d: 16, a: -24000, t: "qr_payment", desc: "Steam", who: "Steam", c: "Entretenimiento" },
  { d: 26, a: -19000, t: "qr_payment", desc: "Cine Hoyts", who: "Hoyts", c: "Entretenimiento" },
  { d: 48, a: -28000, t: "qr_payment", desc: "Bar Palermo", who: "Bar Palermo", c: "Entretenimiento" },
  // Educación
  { d: 21, a: -15000, t: "qr_payment", desc: "Curso Udemy", who: "Udemy", c: "Educación" },
  // Transferencias personales
  { d: 3,  a: -25000, t: "transfer_out", desc: "Transferencia enviada", who: "Lucas Fernández", c: "Transferencias personales" },
  { d: 17, a: -12000, t: "transfer_out", desc: "Transferencia enviada", who: "Sofía Díaz", c: "Transferencias personales" },
  { d: 34, a: -30000, t: "transfer_out", desc: "Transferencia enviada", who: "Lucas Fernández", c: "Transferencias personales" },
  { d: 50, a: -18000, t: "transfer_out", desc: "Transferencia enviada", who: "Juan Pérez", c: "Transferencias personales" },
];

const DEMO_ALERTS = [
  { type: "category_month", threshold: 150000, category: "Comida y delivery", enabled: true },
  { type: "single_movement", threshold: 300000, category: null, enabled: true },
];

async function seedDemo() {
  if (!existsSync(BACKUP)) { console.log("Haciendo backup de tus datos reales primero…"); await backup(); }
  await wipe();
  const rows = DEMO.map((m, i) => ({
    mp_id: `demo_${String(i).padStart(3, "0")}`,
    type: m.t, amount: m.a, currency: "ARS",
    description: m.desc, counterpart_name: m.who, date: iso(m.d),
    status: "approved", category: m.c, raw_data: { demo: true },
  }));
  const r = await supabase.from("movements").insert(rows);
  if (r.error) throw new Error(r.error.message);
  await supabase.from("alerts").insert(DEMO_ALERTS);
  const ing = DEMO.filter(m => m.a > 0).reduce((s, m) => s + m.a, 0);
  const egr = DEMO.filter(m => m.a < 0).reduce((s, m) => s + Math.abs(m.a), 0);
  console.log(`Datos de ejemplo cargados: ${rows.length} movimientos, ${DEMO_ALERTS.length} alertas.`);
  console.log(`Ingresos demo: $${ing.toLocaleString("es-AR")} | Egresos demo: $${egr.toLocaleString("es-AR")}`);
  console.log("\nAhora refrescá la app, sacá las capturas, y después corré: node scripts/seed-demo.mjs restore");
}

try {
  if (cmd === "backup") await backup();
  else if (cmd === "restore") await restore();
  else await seedDemo();
  process.exit(0);
} catch (e) {
  console.log("ERROR:", e.message);
  process.exit(1);
}
