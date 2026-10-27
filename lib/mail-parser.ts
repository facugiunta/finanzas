import type { MovementInsert } from "@/lib/mercadopago";
import type { MovementType } from "@/types";
import { categorize } from "@/lib/categorizer";
import type { RawEmail } from "@/lib/gmail";

/**
 * Convierte un monto en formato AR ("26.151", "1.234,56", "30000") a número.
 * Punto = separador de miles; coma = separador decimal.
 */
export function parseArAmount(raw: string): number {
  let s = raw.trim();
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function mpId(email: RawEmail): string {
  const id = email.messageId.replace(/[<>]/g, "").trim();
  return `mail_${id}`;
}

function build(
  email: RawEmail,
  partial: {
    type: MovementType;
    amount: number; // firmado
    description: string;
    counterpart_name: string | null;
  }
): MovementInsert {
  return {
    mp_id: mpId(email),
    type: partial.type,
    amount: partial.amount,
    currency: "ARS",
    description: partial.description,
    counterpart_name: partial.counterpart_name,
    date: email.date.toISOString(),
    status: "approved",
    raw_data: { source: "gmail", subject: email.subject, from: email.from },
    category: categorize({
      description: partial.description,
      counterpart_name: partial.counterpart_name,
      type: partial.type,
    }),
  };
}

/**
 * Parsea un mail de Mercado Pago a un movimiento.
 * Devuelve null si el mail no es transaccional (alertas, encuestas, etc.).
 */
export function parseMercadoPagoEmail(email: RawEmail): MovementInsert | null {
  const subject = email.subject ?? "";
  const subjLower = subject.toLowerCase();
  const body = email.text ?? "";

  // ── Transferencia enviada (egreso) ──────────────────────────────
  if (subjLower.includes("transferencia") && subjLower.includes("enviada")) {
    const amountMatch =
      body.match(/Los\s*\$\s*([\d.,]+)\s*que transferiste/i) ||
      body.match(/\$\s*([\d.,]+)/);
    const nameMatch = body.match(/Nombre Apellido:\s*(.+)/i);
    const amount = amountMatch ? parseArAmount(amountMatch[1]) : 0;
    const counterpart = nameMatch ? nameMatch[1].trim() : null;
    if (amount > 0) {
      return build(email, {
        type: "transfer_out",
        amount: -amount,
        description: "Transferencia enviada",
        counterpart_name: counterpart,
      });
    }
  }

  // ── Pago aprobado en {comercio} (egreso) ────────────────────────
  const pagoMatch = subject.match(/Pago aprobado en\s+(.+)/i);
  if (pagoMatch) {
    const merchant = pagoMatch[1].trim();
    const amountMatch =
      body.match(/PAGASTE\s*\$\s*([\d.,]+)/i) || body.match(/\$\s*([\d.,]+)/);
    const amount = amountMatch ? parseArAmount(amountMatch[1]) : 0;
    if (amount > 0) {
      return build(email, {
        type: "other",
        amount: -amount,
        description: merchant,
        counterpart_name: merchant,
      });
    }
  }

  // ── Pago a comercio acreditado (egreso) ─────────────────────────
  // "Se acreditó tu pago" → "{Comercio} ya recibió tu pago" + "$monto"
  if (subjLower.includes("acredit") && subjLower.includes("tu pago")) {
    const merchMatch = body.match(/(.+?)\s+ya recibió tu pago/i);
    const amountMatch = body.match(/\$\s*([\d.,]+)/);
    const amount = amountMatch ? parseArAmount(amountMatch[1]) : 0;
    const merchant = merchMatch ? merchMatch[1].trim() : null;
    if (amount > 0) {
      return build(email, {
        type: "other",
        amount: -amount,
        description: merchant ?? "Pago aprobado",
        counterpart_name: merchant,
      });
    }
  }

  // ── Dinero recibido (ingreso) — defensivo, por si aparece ───────
  if (
    subjLower.includes("te transfirieron") ||
    subjLower.includes("recibiste") ||
    /te transfiri[oó]/i.test(body)
  ) {
    const amountMatch = body.match(/\$\s*([\d.,]+)/);
    const amount = amountMatch ? parseArAmount(amountMatch[1]) : 0;
    const nameMatch = body.match(/Nombre Apellido:\s*(.+)/i);
    if (amount > 0) {
      return build(email, {
        type: "transfer_in",
        amount: amount,
        description: "Transferencia recibida",
        counterpart_name: nameMatch ? nameMatch[1].trim() : null,
      });
    }
  }

  // No transaccional
  return null;
}
