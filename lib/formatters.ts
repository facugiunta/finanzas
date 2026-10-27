/**
 * Formateo de números y fechas en formato argentino (es-AR).
 * Ej: 1234567.89 → "$ 1.234.567,89"
 */

const currencyFormatters: Record<string, Intl.NumberFormat> = {};

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return currencyFormatters[currency];
}

/** Formatea un monto como moneda AR. Ej: "$ 1.234.567,89" */
export function formatCurrency(amount: number, currency = "ARS"): string {
  // Intl usa "ARS 1.234,56"; normalizamos a "$ 1.234,56".
  const formatted = getCurrencyFormatter(currency).format(amount);
  return formatted.replace(/^ARS\s?/, "$ ").replace(/^US\$\s?/, "US$ ");
}

/** Formatea un número sin símbolo de moneda. Ej: "1.234.567,89" */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Fecha corta AR. Ej: "24/08/2026" */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Fecha con hora AR. Ej: "24/08/2026 14:30" */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Nombre del mes AR. Ej: "agosto 2026" */
export function formatMonth(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(d);
}
