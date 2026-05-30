"use client";

import { useState, useCallback, useRef } from "react";

export interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useChat(agentId: string | undefined) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string>(
    `${agentId ?? "anon"}-${Date.now()}`
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!agentId || !text.trim()) return;
      setError(null);

      const userMsg: LocalMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        },
      ]);
      setStreaming(true);

      try {
        const res = await fetch(`/api/chat/${agentId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            session_id: sessionId.current,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const lines = part.split("\n");
            let event = "message";
            let data = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) event = line.slice(7).trim();
              if (line.startsWith("data: ")) data = line.slice(6).trim();
            }

            if (event === "token" && data) {
              try {
                const parsed = JSON.parse(data) as { content: string };
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.content }
                      : m
                  )
                );
              } catch {
                // raw token
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + data }
                      : m
                  )
                );
              }
            }

            if (event === "error" && data) {
              try {
                const parsed = JSON.parse(data) as { error: string };
                setError(parsed.error);
              } catch {
                setError(data);
              }
            }
          }
        }
      } catch (err) {
        setError(String(err));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "[Error reaching agent]" }
              : m
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [agentId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionId.current = `${agentId ?? "anon"}-${Date.now()}`;
  }, [agentId]);

  return { messages, streaming, error, sendMessage, clearMessages };
}
