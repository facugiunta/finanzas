import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMercadoPagoEmails, isGmailConfigured } from "@/lib/gmail";
import { parseMercadoPagoEmail } from "@/lib/mail-parser";
import type { MovementInsert } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // segundos (Vercel)

/**
 * POST /api/mail/sync?days=365
 * Lee los mails de Mercado Pago del Gmail configurado, los parsea a
 * movimientos y los guarda en Supabase (upsert por mp_id).
 */
export async function POST(request: NextRequest) {
  // Permitir el cron de Vercel (manda Authorization: Bearer ${CRON_SECRET})
  // o una sesión de usuario válida.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  if (!isGmailConfigured()) {
    return NextResponse.json(
      { error: "Gmail no está configurado (GMAIL_USER / GMAIL_APP_PASSWORD)." },
      { status: 400 }
    );
  }

  const days = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("days") ?? 365), 1),
    1000
  );

  let emails;
  try {
    emails = await fetchMercadoPagoEmails(days);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al leer Gmail: ${message}` },
      { status: 502 }
    );
  }

  // Parsear y quedarnos con los transaccionales
  const movements: MovementInsert[] = [];
  for (const email of emails) {
    const mv = parseMercadoPagoEmail(email);
    if (mv) movements.push(mv);
  }

  if (movements.length === 0) {
    return NextResponse.json({
      synced: 0,
      fetched: emails.length,
      message: "No se encontraron movimientos nuevos en los mails.",
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("movements")
    .upsert(movements, { onConflict: "mp_id", ignoreDuplicates: true })
    .select("mp_id");

  if (error) {
    return NextResponse.json(
      { error: `Error al guardar: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    synced: data?.length ?? 0,
    parsed: movements.length,
    fetched: emails.length,
    message: `Sincronización completa. ${data?.length ?? 0} movimientos nuevos de ${movements.length} parseados.`,
  });
}

/** El cron de Vercel invoca por GET; reusa la misma lógica que POST. */
export async function GET(request: NextRequest) {
  return POST(request);
}
