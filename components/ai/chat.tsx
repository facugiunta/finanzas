"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useChatMessages,
  type UIImage,
  type UIMessage,
} from "@/components/ai/chat-context";

const SUGERENCIAS = [
  "¿En qué estoy gastando de más?",
  "¿Cómo vengo este mes?",
  "Dame un plan para ahorrar",
  "Anotá: gasté 8500 en el súper hoy",
];

/**
 * Normaliza la imagen para Claude: la reescala (máx 1568px por lado) y la
 * convierte a JPEG. Esto arregla formatos no soportados y reduce el tamaño.
 * Rechaza (throw) si el navegador no puede decodificar la imagen (ej. HEIC).
 */
function processFile(file: File): Promise<UIImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1568;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas no disponible"));
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({
        dataUrl,
        base64: dataUrl.split(",")[1] ?? "",
        mediaType: "image/jpeg",
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export function Chat() {
  const router = useRouter();
  const { messages, setMessages } = useChatMessages();
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<UIImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const results = await Promise.allSettled(files.map(processFile));
    const ok = results
      .filter((r): r is PromiseFulfilledResult<UIImage> => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results.length - ok.length;

    if (ok.length) setPendingImages((prev) => [...prev, ...ok]);
    if (failed > 0) {
      setError(
        `${failed} imagen(es) no se pudieron leer (probá con captura de pantalla en PNG o JPG).`
      );
    } else {
      setError(null);
    }
  }

  function removePending(idx: number) {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function toApiMessages(history: UIMessage[]) {
    return history.map((m) => {
      if (m.role === "user" && m.images && m.images.length > 0) {
        return {
          role: "user" as const,
          content: [
            ...m.images.map((img) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: img.mediaType,
                data: img.base64,
              },
            })),
            {
              type: "text" as const,
              text: m.text || "Registrá los movimientos de estas imágenes.",
            },
          ],
        };
      }
      return { role: m.role, content: m.text };
    });
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if ((!text && pendingImages.length === 0) || loading) return;

    const userMsg: UIMessage = {
      role: "user",
      text,
      images: pendingImages.length ? pendingImages : undefined,
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setPendingImages([]);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiMessages(newHistory) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al hablar con el asesor.");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.reply || "Listo.",
            addedCount: Array.isArray(data.added) ? data.added.length : 0,
          },
        ]);
        if (Array.isArray(data.added) && data.added.length > 0) {
          router.refresh();
        }
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col md:h-[calc(100vh-8rem)]">
      {/* Historial */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-500">
              Preguntame sobre tus finanzas o mandame uno o varios screenshots de
              Mercado Pago para que registre los movimientos.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-emerald-500 text-neutral-950"
                  : "border border-neutral-800 bg-neutral-900/60 text-neutral-100"
              }`}
            >
              {m.images && m.images.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {m.images.map((img, k) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={k}
                      src={img.dataUrl}
                      alt="adjunto"
                      className="max-h-40 rounded-lg"
                    />
                  ))}
                </div>
              )}
              {m.text &&
                (m.role === "assistant" ? (
                  <div className="md-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ))}
              {typeof m.addedCount === "number" && m.addedCount > 0 && (
                <p className="mt-1.5 text-xs font-medium text-emerald-400">
                  ✓ {m.addedCount} movimiento{m.addedCount === 1 ? "" : "s"} agregado
                  {m.addedCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-sm text-neutral-500">
              Pensando…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-neutral-800 pt-3">
        {pendingImages.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt="preview"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <button
                  onClick={() => removePending(idx)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-300 hover:bg-rose-500 hover:text-white"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            ))}
            <span className="text-xs text-neutral-500">
              {pendingImages.length} imagen{pendingImages.length === 1 ? "" : "es"}
            </span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            title="Adjuntar screenshots"
            className="rounded-lg border border-neutral-800 px-3 py-2.5 text-sm text-neutral-400 hover:bg-neutral-900"
          >
            📎
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPickImages}
            className="hidden"
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Escribí un mensaje…"
            className="flex-1 resize-none rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => send()}
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
