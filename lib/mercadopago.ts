import type { MovementType } from "@/types";
import { categorize } from "@/lib/categorizer";

const MP_API = "https://api.mercadopago.com";

/** Indica si el Access Token de Mercado Pago está configurado. */
export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

/** Forma cruda (parcial) de un pago devuelto por /v1/payments/search. */
interface MpPayment {
  id: number;
  status?: string;
  date_created?: string;
  date_approved?: string;
  description?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  operation_type?: string;
  payment_type_id?: string;
  payer?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  point_of_interaction?: { type?: string } | null;
}

interface MpSearchResponse {
  paging?: { total: number; limit: number; offset: number };
  results?: MpPayment[];
}

/** Movimiento listo para upsert en Supabase (sin id/created_at). */
export interface MovementInsert {
  mp_id: string;
  type: MovementType;
  amount: number;
  currency: string;
  description: string | null;
  counterpart_name: string | null;
  date: string;
  status: string;
  raw_data: unknown;
  category: string;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/** Deriva el tipo de movimiento a partir de los campos del pago. */
function derivePaymentType(p: MpPayment): MovementType {
  if (p.point_of_interaction?.type === "QR") return "qr_payment";
  if (p.operation_type === "money_transfer") return "transfer_in";
  if (p.payment_type_id === "bank_transfer") return "transfer_in";
  if (p.operation_type === "regular_payment") return "link_payment";
  return "other";
}

function payerName(p: MpPayment): string | null {
  const first = p.payer?.first_name?.trim() ?? "";
  const last = p.payer?.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full || p.payer?.email || null;
}

/** Mapea un pago de MP a nuestro modelo. Los pagos son cobros → ingreso (+). */
export function mapPaymentToMovement(p: MpPayment): MovementInsert {
  const type = derivePaymentType(p);
  const description = p.description ?? null;
  const counterpart_name = payerName(p);

  return {
    mp_id: `pay_${p.id}`,
    type,
    amount: Math.abs(p.transaction_amount ?? 0), // cobro = ingreso positivo
    currency: p.currency_id ?? "ARS",
    description,
    counterpart_name,
    date: p.date_approved ?? p.date_created ?? new Date().toISOString(),
    status: p.status ?? "approved",
    raw_data: p,
    category: categorize({ description, counterpart_name, type }),
  };
}

/**
 * Trae todos los pagos (cobros) de los últimos `days` días desde MP,
 * manejando paginación. Devuelve los movimientos ya mapeados.
 */
export async function fetchPayments(days = 90): Promise<MovementInsert[]> {
  if (!isMercadoPagoConfigured()) {
    throw new Error("MP_ACCESS_TOKEN no está configurado.");
  }

  const limit = 50;
  let offset = 0;
  const all: MovementInsert[] = [];
  const MAX_PAGES = 100; // salvaguarda (hasta 5000 movimientos)

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      sort: "date_created",
      criteria: "desc",
      range: "date_created",
      begin_date: `NOW-${days}DAYS`,
      end_date: "NOW",
      limit: String(limit),
      offset: String(offset),
    });

    const res = await fetch(`${MP_API}/v1/payments/search?${params}`, {
      headers: authHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Mercado Pago respondió ${res.status}: ${body.slice(0, 300)}`
      );
    }

    const data = (await res.json()) as MpSearchResponse;
    const results = data.results ?? [];
    all.push(...results.map(mapPaymentToMovement));

    const total = data.paging?.total ?? 0;
    offset += limit;
    if (results.length === 0 || offset >= total) break;
  }

  return all;
}
