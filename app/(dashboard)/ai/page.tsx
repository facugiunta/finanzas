import { Chat } from "@/components/ai/chat";
import { isAnthropicConfigured } from "@/lib/anthropic";

export default function AiPage() {
  const configured = isAnthropicConfigured();

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Asesor IA</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Chat con Claude sobre tus finanzas · mandá un screenshot y lo registra
        </p>
      </header>

      {configured ? (
        <Chat />
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <p className="font-medium">Falta configurar la API de Anthropic</p>
          <p className="mt-1 text-amber-300/80">
            Agregá{" "}
            <code className="rounded bg-neutral-800 px-1.5 py-0.5">
              ANTHROPIC_API_KEY
            </code>{" "}
            en <code className="rounded bg-neutral-800 px-1.5 py-0.5">.env.local</code>{" "}
            (la conseguís en console.anthropic.com) y reiniciá el server.
          </p>
        </div>
      )}
    </div>
  );
}
