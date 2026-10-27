"use client";

import { createContext, useContext, useState } from "react";

export interface UIImage {
  dataUrl: string;
  base64: string;
  mediaType: string;
}
export interface UIMessage {
  role: "user" | "assistant";
  text: string;
  images?: UIImage[];
  addedCount?: number;
}

interface ChatCtx {
  messages: UIMessage[];
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>;
}

const Ctx = createContext<ChatCtx | null>(null);

/**
 * Mantiene el historial del chat vivo mientras se navega entre pantallas
 * del dashboard (el layout no se desmonta). Se limpia al recargar la página.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  return <Ctx.Provider value={{ messages, setMessages }}>{children}</Ctx.Provider>;
}

export function useChatMessages(): ChatCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useChatMessages debe usarse dentro de ChatProvider");
  return c;
}
