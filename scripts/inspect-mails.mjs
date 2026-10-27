// Inspecciona los mails de Mercado Pago en tu Gmail para diseñar el parser.
// Uso: node scripts/inspect-mails.mjs [dias]
import { readFileSync } from "node:fs";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const env = {};
for (const l of readFileSync("./.env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
  console.log("Faltan GMAIL_USER / GMAIL_APP_PASSWORD en .env.local");
  process.exit(1);
}

const days = Number(process.argv[2] ?? 90);
const since = new Date(Date.now() - days * 86400000);

const c = new ImapFlow({
  host: "imap.gmail.com",
  port: 993,
  secure: true,
  auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD.replace(/\s+/g, "") },
  logger: false,
});

await c.connect();
const lock = await c.getMailboxLock("INBOX");
let count = 0;
try {
  const uids = await c.search({ from: "mercadopago", since }, { uid: true });
  console.log(`Mails de MP (INBOX, últimos ${days} días): ${uids?.length ?? 0}\n`);
  for await (const msg of c.fetch(uids ?? [], { uid: true, source: true }, { uid: true })) {
    if (!msg.source) continue;
    const p = await simpleParser(msg.source);
    count++;
    const text = (p.text ?? "").replace(/\n{2,}/g, "\n").trim();
    console.log("─".repeat(70));
    console.log("FECHA :", p.date?.toISOString());
    console.log("FROM  :", p.from?.text);
    console.log("ASUNTO:", p.subject);
    console.log("CUERPO:\n" + text.slice(0, 400));
    if (count >= 15) break; // no inundar
  }
} finally {
  lock.release();
  await c.logout();
}
console.log("\nMostrados:", count);
