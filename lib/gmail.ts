import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

/** Indica si las credenciales de Gmail están configuradas. */
export function isGmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

/** Convierte HTML a texto plano visible (para mails sin parte text/plain). */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|td|h\d|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export interface RawEmail {
  messageId: string;
  date: Date;
  from: string;
  subject: string;
  text: string; // cuerpo en texto plano (sin HTML)
}

function client(): ImapFlow {
  return new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, ""),
    },
    logger: false,
  });
}

/** Devuelve el path del buzón "All Mail" (incluye archivados), con fallback. */
async function resolveAllMailPath(c: ImapFlow): Promise<string> {
  const boxes = await c.list();
  for (const b of boxes) {
    if (b.specialUse === "\\All") return b.path;
  }
  return "INBOX";
}

/**
 * Trae mails de los últimos `days` días cuyo remitente matchea `fromQuery`
 * (ej: "mercadopago"). Lee de "All Mail" para incluir los archivados.
 * Devuelve el cuerpo ya parseado a texto plano.
 */
export async function fetchEmails(
  fromQuery: string,
  days = 90,
  mailbox?: string
): Promise<RawEmail[]> {
  if (!isGmailConfigured()) {
    throw new Error("Gmail no está configurado (GMAIL_USER / GMAIL_APP_PASSWORD).");
  }

  const since = new Date(Date.now() - days * 86400000);
  const c = client();
  const emails: RawEmail[] = [];

  await c.connect();
  const box = mailbox ?? (await resolveAllMailPath(c));
  const lock = await c.getMailboxLock(box);
  try {
    const uids = await c.search({ from: fromQuery, since }, { uid: true });
    if (uids && uids.length) {
      for await (const msg of c.fetch(
        uids,
        { uid: true, source: true },
        { uid: true }
      )) {
        if (!msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const text =
          parsed.text && parsed.text.trim()
            ? parsed.text
            : parsed.html
              ? htmlToText(parsed.html)
              : "";
        emails.push({
          messageId: parsed.messageId ?? `uid_${msg.uid}`,
          date: parsed.date ?? new Date(),
          from: parsed.from?.text ?? "",
          subject: parsed.subject ?? "",
          text: text.replace(/\s+\n/g, "\n").trim(),
        });
      }
    }
  } finally {
    lock.release();
    await c.logout();
  }

  return emails;
}

/** Atajo: mails de Mercado Pago de los últimos `days` días. */
export function fetchMercadoPagoEmails(days = 90): Promise<RawEmail[]> {
  return fetchEmails("mercadopago", days);
}
