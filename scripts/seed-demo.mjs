import { readFileSync } from "node:fs";
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

// Limpieza opcional: node _seed.mjs --clean
if (process.argv.includes("--clean")) {
  const { error } = await supabase.from("movements").delete().like("mp_id", "demo_%");
  console.log(error ? "ERROR: " + error.message : "Datos demo eliminados.");
  process.exit(error ? 1 : 0);
}

const iso = (daysAgo) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString();

// amount: positivo = ingreso, negativo = egreso
const demo = [
  // Ingresos
  { d: 2,   type: "transfer_in", amount: 850000,  desc: "Cobro honorarios freelance", who: "Estudio Delta", cat: "Cobros / ingresos" },
  { d: 32,  type: "transfer_in", amount: 850000,  desc: "Cobro honorarios freelance", who: "Estudio Delta", cat: "Cobros / ingresos" },
  { d: 62,  type: "transfer_in", amount: 780000,  desc: "Cobro honorarios freelance", who: "Estudio Delta", cat: "Cobros / ingresos" },
  { d: 15,  type: "transfer_in", amount: 45000,   desc: "Transferencia recibida",     who: "Martín G.",     cat: "Transferencias personales" },
  { d: 48,  type: "transfer_in", amount: 120000,  desc: "Venta usados MercadoLibre",  who: "Comprador ML",  cat: "Cobros / ingresos" },

  // Egresos - Comida
  { d: 1,   type: "qr_payment", amount: -12500, desc: "PedidosYa",        who: "PedidosYa",   cat: "Comida y delivery" },
  { d: 4,   type: "qr_payment", amount: -8900,  desc: "McDonald's",       who: "Arcos Dorados", cat: "Comida y delivery" },
  { d: 20,  type: "qr_payment", amount: -15400, desc: "Rappi restó",      who: "Rappi",        cat: "Comida y delivery" },
  { d: 40,  type: "qr_payment", amount: -6200,  desc: "Panadería La Espiga", who: null,        cat: "Comida y delivery" },
  // Transporte
  { d: 3,   type: "qr_payment", amount: -4500,  desc: "Uber viaje",       who: "Uber",         cat: "Transporte" },
  { d: 9,   type: "service_payment", amount: -20000, desc: "Carga SUBE",  who: "SUBE",         cat: "Transporte" },
  { d: 27,  type: "qr_payment", amount: -35000, desc: "YPF nafta",        who: "YPF",          cat: "Transporte" },
  // Servicios
  { d: 6,   type: "service_payment", amount: -7500,  desc: "Netflix",     who: "Netflix",      cat: "Servicios" },
  { d: 6,   type: "service_payment", amount: -5200,  desc: "Spotify Premium", who: "Spotify",  cat: "Servicios" },
  { d: 12,  type: "service_payment", amount: -48000, desc: "Edenor luz",  who: "Edenor",       cat: "Servicios" },
  { d: 35,  type: "service_payment", amount: -32000, desc: "Movistar abono", who: "Movistar",  cat: "Servicios" },
  // Compras online
  { d: 8,   type: "qr_payment", amount: -89000, desc: "MercadoLibre compra", who: "MercadoLibre", cat: "Compras online" },
  { d: 50,  type: "qr_payment", amount: -45000, desc: "Amazon",          who: "Amazon",       cat: "Compras online" },
  // Entretenimiento
  { d: 18,  type: "qr_payment", amount: -22000, desc: "Steam juego",     who: "Steam",        cat: "Entretenimiento" },
  { d: 45,  type: "qr_payment", amount: -18000, desc: "Cinemark entradas", who: "Cinemark",   cat: "Entretenimiento" },
  // Salud
  { d: 14,  type: "qr_payment", amount: -13500, desc: "Farmacity",       who: "Farmacity",    cat: "Salud" },
  // Transferencia enviada
  { d: 5,   type: "transfer_out", amount: -30000, desc: "Transferencia enviada", who: "Lucía P.", cat: "Transferencias personales" },
];

const rows = demo.map((m, i) => ({
  mp_id: `demo_${String(i).padStart(3, "0")}`,
  type: m.type,
  amount: m.amount,
  currency: "ARS",
  description: m.desc,
  counterpart_name: m.who,
  date: iso(m.d),
  status: "approved",
  category: m.cat,
  raw_data: { demo: true },
}));

const { data, error } = await supabase
  .from("movements")
  .upsert(rows, { onConflict: "mp_id" })
  .select("mp_id");

console.log(error ? "ERROR: " + error.message : `Insertados/actualizados: ${data.length} movimientos demo.`);
process.exit(error ? 1 : 0);
