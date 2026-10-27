import type { Category, MovementType } from "@/types";

/** Todas las categorías, en orden de uso. */
export const CATEGORIES: Category[] = [
  "Comida y delivery",
  "Transporte",
  "Servicios",
  "Compras online",
  "Transferencias personales",
  "Cobros / ingresos",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Otros",
];

/** Tipos de movimiento con etiqueta en español. */
export const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: "transfer_in", label: "Transferencia recibida" },
  { value: "transfer_out", label: "Transferencia enviada" },
  { value: "qr_payment", label: "Pago con QR" },
  { value: "link_payment", label: "Pago por link" },
  { value: "service_payment", label: "Pago de servicio" },
  { value: "extraction", label: "Extracción" },
  { value: "recharge", label: "Recarga" },
  { value: "other", label: "Otro" },
];

export const TYPE_LABELS: Record<MovementType, string> = Object.fromEntries(
  MOVEMENT_TYPES.map((t) => [t.value, t.label])
) as Record<MovementType, string>;
