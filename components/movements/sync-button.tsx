"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton({
  endpoint = "/api/mail/sync",
  label = "Sincronizar",
}: {
  endpoint?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSync() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Error al sincronizar." });
      } else {
        setMsg({ ok: true, text: data.message ?? "Sincronización completa." });
        router.refresh(); // recarga los datos server-side de la página
      }
    } catch {
      setMsg({ ok: false, text: "No se pudo conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sincronizando…" : label}
      </button>
      {msg && (
        <p
          className={`text-xs ${
            msg.ok ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
