"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Video, Mic, Loader2, Send } from "lucide-react";
import { useAgentContext } from "@/providers/AgentProvider";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type GenerateMode = "image" | "video" | "voice";

interface Preset {
  mode: GenerateMode;
  label: string;
  icon: React.ElementType;
  promptTemplate: string;
  color: string;
}

const PRESETS: Preset[] = [
  {
    mode: "image",
    label: "Generate Image",
    icon: ImageIcon,
    promptTemplate: "Generate an image of: ",
    color: "text-purple-400",
  },
  {
    mode: "video",
    label: "Generate Video",
    icon: Video,
    promptTemplate: "Generate a short video of: ",
    color: "text-blue-400",
  },
  {
    mode: "voice",
    label: "Generate Voice",
    icon: Mic,
    promptTemplate: "Generate voice audio saying: ",
    color: "text-emerald-400",
  },
];

interface GeneratedOutput {
  type: GenerateMode;
  url: string;
  prompt: string;
  timestamp: string;
}

export function StudioTab() {
  const { activeAgent } = useAgentContext();
  const { sendMessage, streaming, messages } = useChat(activeAgent?.id);

  const [mode, setMode] = useState<GenerateMode>("image");
  const [prompt, setPrompt] = useState("");
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);

  const preset = PRESETS.find((p) => p.mode === mode)!;

  const [pendingCapture, setPendingCapture] = useState<{
    mode: GenerateMode;
    prompt: string;
  } | null>(null);

  // After streaming ends, scan the last assistant message for a URL
  useEffect(() => {
    if (!pendingCapture || streaming) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant?.content) {
      const urlMatch = lastAssistant.content.match(/https?:\/\/\S+/);
      if (urlMatch) {
        setOutputs((prev) => [
          {
            type: pendingCapture.mode,
            url: urlMatch[0],
            prompt: pendingCapture.prompt,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }
    setPendingCapture(null);
  }, [streaming, pendingCapture, messages]);

  async function handleGenerate() {
    if (!prompt.trim() || !activeAgent) return;
    const fullPrompt = preset.promptTemplate + prompt.trim();
    setPendingCapture({ mode, prompt: prompt.trim() });
    sendMessage(fullPrompt);
  }

  if (!activeAgent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Select an agent to use Studio.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: form */}
      <div className="w-[340px] shrink-0 border-r border-border p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-semibold mb-4">Generate with {activeAgent.name}</h2>

          {/* Mode selector */}
          <div className="flex gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.mode}
                onClick={() => setMode(p.mode)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-colors text-xs",
                  mode === p.mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
                )}
              >
                <p.icon className={cn("w-4 h-4", mode === p.mode && p.color)} />
                {p.label.split(" ")[1]}
              </button>
            ))}
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              placeholder={`Describe the ${mode} you want to generate…`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || streaming}
          className="w-full gap-2"
        >
          {streaming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Generate {mode}
            </>
          )}
        </Button>

        {/* Last assistant message (streaming feedback) */}
        {messages.length > 0 && (
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground max-h-40 overflow-y-auto">
            {messages[messages.length - 1].content || "…"}
          </div>
        )}
      </div>

      {/* Right: outputs */}
      <div className="flex-1 p-6 overflow-y-auto">
        {outputs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <ImageIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm">Generated outputs will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 auto-rows-min">
            {outputs.map((out, i) => (
              <OutputCard key={i} output={out} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OutputCard({ output }: { output: GeneratedOutput }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {output.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={output.url}
          alt={output.prompt}
          className="w-full aspect-square object-cover"
        />
      )}
      {output.type === "video" && (
        <video
          src={output.url}
          controls
          className="w-full aspect-video"
        />
      )}
      {output.type === "voice" && (
        <div className="p-4">
          <audio src={output.url} controls className="w-full" />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-muted-foreground truncate">{output.prompt}</p>
      </div>
    </div>
  );
}
