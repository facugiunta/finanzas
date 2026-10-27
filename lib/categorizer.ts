import type { Category, MovementType } from "@/types";

/**
 * Categorización automática por keywords sobre la descripción + contraparte.
 * No usa IA (para no gastar tokens). El usuario puede reasignar manualmente.
 */

const KEYWORDS: Record<Exclude<Category, "Otros">, string[]> = {
  "Comida y delivery": [
    "pedidosya",
    "pedidos ya",
    "rappi",
    "mcdonald",
    "burger",
    "starbucks",
    "cafe",
    "café",
    "resto",
    "restaurant",
    "delivery",
    "kiosco",
    "panaderia",
    "panadería",
    "heladeria",
    "heladería",
    "pizza",
    "sushi",
    "empanada",
  ],
  Transporte: [
    "uber",
    "cabify",
    "didi",
    "sube",
    "ypf",
    "shell",
    "axion",
    "puma",
    "nafta",
    "combustible",
    "peaje",
    "estacionamiento",
    "cochera",
    "subte",
    "colectivo",
    "taxi",
    "remis",
  ],
  Servicios: [
    "edenor",
    "edesur",
    "metrogas",
    "aysa",
    "telecom",
    "fibertel",
    "movistar",
    "personal",
    "claro",
    "netflix",
    "spotify",
    "disney",
    "hbo",
    "max",
    "youtube premium",
    "amazon prime",
    "internet",
    "luz",
    "gas",
    "agua",
    "expensas",
    "abono",
    "suscripcion",
    "suscripción",
  ],
  "Compras online": [
    "mercadolibre",
    "mercado libre",
    "amazon",
    "aliexpress",
    "temu",
    "tiendanube",
    "ebay",
    "shein",
    "compra online",
    "tienda",
  ],
  "Transferencias personales": [
    "transferencia",
    "cvu",
    "cbu",
    "alias",
    "envio de dinero",
    "envío de dinero",
    "money transfer",
  ],
  "Cobros / ingresos": [
    "cobro",
    "sueldo",
    "salario",
    "honorarios",
    "factura",
    "pago recibido",
    "ingreso",
    "acreditacion",
    "acreditación",
    "deposito",
    "depósito",
  ],
  Entretenimiento: [
    "cine",
    "cinemark",
    "hoyts",
    "teatro",
    "steam",
    "playstation",
    "xbox",
    "nintendo",
    "twitch",
    "bar",
    "boliche",
    "juego",
    "entrada",
    "ticketek",
    "ticketportal",
  ],
  Salud: [
    "farmacia",
    "farmacity",
    "osde",
    "swiss medical",
    "galeno",
    "medife",
    "hospital",
    "clinica",
    "clínica",
    "medico",
    "médico",
    "dentista",
    "laboratorio",
    "optica",
    "óptica",
  ],
  Educación: [
    "universidad",
    "facultad",
    "colegio",
    "curso",
    "udemy",
    "coursera",
    "platzi",
    "libreria",
    "librería",
    "capacitacion",
    "capacitación",
    "instituto",
  ],
};

/** Normaliza: minúsculas y sin acentos, para matchear más flexible. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Devuelve la categoría de un movimiento según su descripción, contraparte
 * y tipo. Si nada matchea, devuelve "Otros".
 */
export function categorize(input: {
  description?: string | null;
  counterpart_name?: string | null;
  type?: MovementType;
}): Category {
  const haystack = normalize(
    `${input.description ?? ""} ${input.counterpart_name ?? ""}`
  );

  if (haystack.trim()) {
    for (const [category, keywords] of Object.entries(KEYWORDS)) {
      if (keywords.some((kw) => haystack.includes(normalize(kw)))) {
        return category as Category;
      }
    }
  }

  // Fallback por tipo de movimiento
  switch (input.type) {
    case "transfer_in":
      return "Cobros / ingresos";
    case "transfer_out":
      return "Transferencias personales";
    case "service_payment":
      return "Servicios";
    default:
      return "Otros";
  }
}
