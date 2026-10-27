import { NextResponse, type NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAnthropicClient,
  isAnthropicConfigured,
  buildSystemPrompt,
  AGREGAR_MOVIMIENTOS_TOOL,
  CHAT_MODEL,
} from "@/lib/anthropic";
import { computeDashboard } from "@/lib/metrics";
import { categorize } from "@/lib/categorizer";
import { formatCurrency } from "@/lib/formatters";
import type { Category, Movement, MovementType } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface MovInput {
  direccion: "ingreso" | "egreso";
  monto: number;
  fecha: string;
  descripcion?: string;
  contraparte?: string;
  categoria?: Category;
  tipo?: MovementType;
}

/** Inserta los movimientos que Claude pide agregar. Devuelve un resumen. */
async function ejecutarAgregar(movs: MovInput[]) {
  const admin = createAdminClient();
  const rows = movs.map((m, i) => {
    const amount =
      m.direccion === "egreso" ? -Math.abs(m.monto) : Math.abs(m.monto);
    const type: MovementType =
      m.tipo ?? (m.direccion === "ingreso" ? "transfer_in" : "other");
    const category =
      m.categoria ??
      categorize({
        description: m.descripcion,
        counterpart_name: m.contraparte,
        type,
      });
    return {
      mp_id: `manual_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      amount,
      currency: "ARS",
      description: m.descripcion ?? null,
      counterpart_name: m.contraparte ?? null,
      date: new Date(`${m.fecha}T12:00:00.000Z`).toISOString(),
      status: "approved",
      category,
      raw_data: { source: "ia" },
    };
  });

  const { data, error } = await admin.from("movements").insert(rows).select("id, amount, description, category, date");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function buildContext(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("movements")
    .select("*")
    .order("date", { ascending: false })
    .limit(500);
  const movements = (data as Movement[]) ?? [];
  if (movements.length === 0) return "";

  const m = computeDashboard(movements);
  const topCats = m.monthByCategory
    .slice(0, 5)
    .map((c) => `${c.category}: ${formatCurrency(c.total)}`)
    .join(", ");

  return [
    `- Total de movimientos guardados: ${movements.length}`,
    `- Balance neto: ${formatCurrency(m.balance)}`,
    `- Ingresos del mes: ${formatCurrency(m.monthIncome)}`,
    `- Egresos del mes: ${formatCurrency(m.monthExpense)}`,
    `- Gasto promedio diario (mes): ${formatCurrency(m.avgDailySpend)}`,
    topCats ? `- Gasto por categoría (mes): ${topCats}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en .env.local." },
      { status: 400 }
    );
  }

  let body: { messages?: Anthropic.MessageParam[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Faltan mensajes." }, { status: 400 });
  }

  // Diagnóstico: estructura de los mensajes entrantes (sin volcar base64)
  try {
    const last = messages[messages.length - 1];
    if (last && Array.isArray(last.content)) {
      const summary = (last.content as { type: string; source?: { media_type?: string; data?: string } }[]).map(
        (b) =>
          b.type === "image"
            ? `image(${b.source?.media_type}, ${Math.round((b.source?.data?.length ?? 0) / 1024)}KB b64)`
            : b.type
      );
      console.log("[chat] último mensaje bloques:", summary);
    }
  } catch {}

  const client = getAnthropicClient();
  const today = new Date().toLocaleDateString("sv-SE");
  const system = buildSystemPrompt(await buildContext(), today);

  const working: Anthropic.MessageParam[] = [...messages];
  const added: unknown[] = [];

  try {
    // Loop de tool use (máx 5 iteraciones de seguridad)
    for (let i = 0; i < 5; i++) {
      const res = await client.messages.create({
        model: CHAT_MODEL,
        max_tokens: 2048,
        system,
        tools: [AGREGAR_MOVIMIENTOS_TOOL],
        messages: working,
      });

      console.log(
        `[chat] iter ${i} stop_reason=${res.stop_reason} bloques=`,
        res.content.map((b) => b.type)
      );

      working.push({ role: "assistant", content: res.content });

      if (res.stop_reason !== "tool_use") {
        const text = res.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({ reply: text, added });
      }

      // Ejecutar cada tool_use y devolver los tool_result
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type !== "tool_use") continue;
        if (block.name === "agregar_movimientos") {
          try {
            const input = block.input as { movimientos: MovInput[] };
            const inserted = await ejecutarAgregar(input.movimientos ?? []);
            added.push(...inserted);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: `Se agregaron ${inserted.length} movimiento(s) correctamente.`,
            });
          } catch (e) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              is_error: true,
              content: `Error al agregar: ${e instanceof Error ? e.message : "desconocido"}`,
            });
          }
        }
      }
      working.push({ role: "user", content: toolResults });
    }

    return NextResponse.json({
      reply: "Listo, procesé todo (se alcanzó el máximo de pasos).",
      added,
    });
  } catch (e) {
    console.error("[chat] ERROR:", e);
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error del asesor IA: ${message}` },
      { status: 502 }
    );
  }
}
