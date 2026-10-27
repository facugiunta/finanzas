import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, MOVEMENT_TYPES } from "@/lib/categories";

export const CHAT_MODEL = "claude-sonnet-4-6";

/** Indica si la API key de Anthropic está configurada. */
export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(): Anthropic {
  return new Anthropic(); // toma ANTHROPIC_API_KEY del entorno
}

/**
 * Herramienta que Claude puede llamar para registrar movimientos.
 * Pensada para cargar lo que el usuario dicta o lo que se extrae de un
 * screenshot de Mercado Pago / comprobante.
 */
export const AGREGAR_MOVIMIENTOS_TOOL: Anthropic.Tool = {
  name: "agregar_movimientos",
  description:
    "Registra uno o más movimientos financieros (gastos o ingresos) en la base " +
    "de datos del usuario. Usala cuando el usuario pida anotar un gasto/ingreso, " +
    "o cuando extraigas movimientos de una imagen/screenshot de Mercado Pago o de " +
    "un comprobante. Extraé TODOS los movimientos visibles. Si algún dato no está " +
    "claro (fecha, monto), pedí aclaración en vez de inventarlo.",
  input_schema: {
    type: "object",
    properties: {
      movimientos: {
        type: "array",
        description: "Lista de movimientos a registrar.",
        items: {
          type: "object",
          properties: {
            direccion: {
              type: "string",
              enum: ["ingreso", "egreso"],
              description: "ingreso = entra plata; egreso = sale plata.",
            },
            monto: {
              type: "number",
              description: "Monto positivo (sin signo), en pesos.",
            },
            fecha: {
              type: "string",
              description: "Fecha en formato YYYY-MM-DD.",
            },
            descripcion: {
              type: "string",
              description: "Descripción breve (comercio, concepto).",
            },
            contraparte: {
              type: "string",
              description: "Nombre de quien envió/recibió, si aplica.",
            },
            categoria: {
              type: "string",
              enum: CATEGORIES,
              description: "Categoría del movimiento.",
            },
            tipo: {
              type: "string",
              enum: MOVEMENT_TYPES.map((t) => t.value),
              description: "Tipo de movimiento.",
            },
          },
          required: ["direccion", "monto", "fecha"],
        },
      },
    },
    required: ["movimientos"],
  },
};

/** System prompt del asesor, con el contexto financiero inyectado. */
export function buildSystemPrompt(contextText: string, today: string): string {
  return [
    "Sos el asesor financiero personal de una app de finanzas, en Argentina.",
    "Hablás en español rioplatense (voseo), con un tono CÁLIDO, cercano y alentador,",
    "como un amigo que sabe de plata y te quiere bien. Sé empático y positivo:",
    "celebrá los logros ('¡buenísimo que cerraste el mes en verde! 🎉'), y cuando",
    "haya algo para mejorar, decilo con onda y sin juzgar. Nada de tono frío ni de informe.",
    `La fecha de hoy es ${today}.`,
    "",
    "FORMATO (es un chat en el celular, respuestas cortas y fáciles de leer):",
    "- Párrafos breves y frases simples. No escribas textos larguísimos.",
    "- Usá **negritas** para lo importante y listas con viñetas cuando ayuden.",
    "- Podés usar algún emoji con moderación para dar calidez.",
    "- EVITÁ las tablas grandes: en el celu no se leen bien. Mejor una lista o frases.",
    "- Los montos en pesos argentinos, formato $ 1.234,56.",
    "",
    "Podés hacer dos cosas:",
    "1. Responder preguntas y dar consejos sobre las finanzas del usuario.",
    "2. Registrar movimientos usando la herramienta `agregar_movimientos` cuando el usuario",
    "   te lo pida o te mande un screenshot/comprobante con transacciones.",
    "",
    "Reglas para registrar movimientos desde imágenes (MUY IMPORTANTE):",
    "- Cuando recibas una o más imágenes con transacciones, SIEMPRE llamá a la",
    "  herramienta `agregar_movimientos` con TODO lo que puedas extraer. NO te",
    "  limites a describir la imagen: el objetivo es cargar los movimientos.",
    "- Extraé TODOS los movimientos visibles en TODAS las imágenes.",
    "- Identificá bien la dirección (ingreso vs egreso), el monto, la fecha y la contraparte.",
    "  En Mercado Pago: 'Pagaste'/'Transferiste'/'Pago' = egreso; 'Te transfirieron'/",
    "  'Cobro'/'Recibiste' = ingreso.",
    "- Los montos en formato argentino usan punto para miles y coma para decimales",
    "  (ej: '$ 1.234,56' = 1234.56).",
    "- Si no ves la fecha exacta de un movimiento, usá la fecha de hoy.",
    "- Solo pedí aclaración si una imagen es totalmente ilegible; si podés leer algo, cargalo.",
    "- Después de registrar, confirmá en una o dos frases qué agregaste (cantidad y total).",
    "",
    "Contexto financiero actual del usuario:",
    contextText || "(todavía no hay movimientos cargados)",
  ].join("\n");
}
