/** Tipos de movimiento en Mercado Pago. */
export type MovementType =
  | "transfer_in"
  | "transfer_out"
  | "qr_payment"
  | "link_payment"
  | "service_payment"
  | "extraction"
  | "recharge"
  | "other";

/** Categorías asignadas automáticamente (ver lib/categorizer.ts, paso 5). */
export type Category =
  | "Comida y delivery"
  | "Transporte"
  | "Servicios"
  | "Compras online"
  | "Transferencias personales"
  | "Cobros / ingresos"
  | "Entretenimiento"
  | "Salud"
  | "Educación"
  | "Otros";

/** Fila de la tabla `movements` en Supabase. */
export interface Movement {
  id: string;
  mp_id: string;
  type: MovementType;
  amount: number;
  currency: string;
  description: string | null;
  counterpart_name: string | null;
  date: string;
  status: string;
  raw_data: unknown;
  category: Category;
  created_at: string;
}
