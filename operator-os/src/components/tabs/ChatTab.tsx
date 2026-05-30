"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Bot, User } from "lucide-react";
import { useAgentContext } from "@/providers/AgentProvider";
import { useChat } from "@/hooks/useChat";
import { useSessions } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, timeAgo } from "@/lib/utils";

export function ChatTab() {
  const { activeAgent } = useAgentContext();
  const { messages, streaming, error, sendMessage, clearMessages } = useChat(
    activeAgent?.id
  );
  const { data: history = [] } = useSessions(activeAgent?.id);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming || !activeAgent) return;
    sendMessage(trimmed);
    setInput("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const allMessages = [
    ...history.map((m) => ({ ...m, source: "history" as const })),
    ...messages.map((m) => ({ ...m, source: "live" as const })),
  ];

  if (!activeAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6">
        <Bot className="w-10 h-10 opacity-20" />
        <p className="text-sm text-center">
          Tap the menu in the top-left to select an agent and start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: activeAgent.color }}
          />
          <span className="font-medium text-sm truncate">{activeAgent.name}</span>
          <span className="text-xs text-muted-foreground font-mono hidden sm:block truncate max-w-[180px]">
            {activeAgent.url}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearMessages}
          className="text-muted-foreground shrink-0"
          title="Clear session"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 sm:px-6 py-4">
        {allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <Bot className="w-8 h-8 opacity-30" />
            <p className="text-sm text-center">
              Say something to{" "}
              <span style={{ color: activeAgent.color }}>{activeAgent.name}</span>.
            </p>
          </div>
        )}

        <div className="space-y-4 max-w-3xl mx-auto">
          {allMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2 sm:gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === "user" ? "bg-primary/20" : "bg-accent"
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                ) : (
                  <Bot
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                    style={{ color: activeAgent.color }}
                  />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary/15 text-foreground rounded-tr-sm"
                    : "bg-card text-foreground rounded-tl-sm border border-border"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1 text-right">
                  {timeAgo(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Streaming cursor */}
          {streaming && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-accent">
                <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: activeAgent.color }} />
              </div>
              <div className="bg-card rounded-2xl rounded-tl-sm border border-border px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive px-2">{error}</p>
          )}
        </div>

        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="px-3 sm:px-6 py-3 border-t border-border shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder={`Message ${activeAgent.name}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[44px] max-h-[160px] text-base sm:text-sm"
            rows={1}
            disabled={streaming}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
