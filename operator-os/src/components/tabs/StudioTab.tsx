"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageIcon, Video, Mic, Search, Loader2, Send, RefreshCw, BookmarkPlus } from "lucide-react";
import { useAgentContext } from "@/providers/AgentProvider";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type StudioMode = "image" | "video" | "voice" | "xsearch";

interface Preset {
  mode: StudioMode;
  label: string;
  icon: React.ElementType;
  promptTemplate: string;
  color: string;
}

const PRESETS: Preset[] = [
  { mode: "image",   label: "Image",    icon: ImageIcon, promptTemplate: "Generate an image of: ",         color: "text-purple-400" },
  { mode: "video",   label: "Video",    icon: Video,     promptTemplate: "Generate a short video of: ",    color: "text-blue-400" },
  { mode: "voice",   label: "Voice",    icon: Mic,       promptTemplate: "Generate voice audio saying: ",  color: "text-emerald-400" },
  { mode: "xsearch", label: "X-Search", icon: Search,    promptTemplate: "",                                color: "text-amber-400" },
];

interface GeneratedOutput {
  type: StudioMode;
  url?: string;
  content?: string;
  prompt: string;
  timestamp: string;
}

interface SavedSearch {
  query: string;
  result: string;
  savedAt: string;
}

export function StudioTab() {
  const { activeAgent } = useAgentContext();
  const { sendMessage, streaming, messages } = useChat(activeAgent?.id);

  const [mode, setMode] = useState<StudioMode>("image");
  const [prompt, setPrompt] = useState("");
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [pendingCapture, setPendingCapture] = useState<{ mode: StudioMode; prompt: string } | null>(null);

  // X-Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  const preset = PRESETS.find((p) => p.mode === mode)!;

  useEffect(() => {
    if (!pendingCapture || streaming) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last?.content) {
      const urlMatch = last.content.match(/https?:\/\/\S+/);
      setOutputs((prev) => [
        {
          type: pendingCapture.mode,
          url: urlMatch?.[0],
          content: urlMatch ? undefined : last.content,
          prompt: pendingCapture.prompt,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setPendingCapture(null);
  }, [streaming, pendingCapture, messages]);

  function handleGenerate() {
    if (!prompt.trim() || !activeAgent) return;
    const fullPrompt = preset.promptTemplate + prompt.trim();
    setPendingCapture({ mode, prompt: prompt.trim() });
    sendMessage(fullPrompt);
  }

  const handleXSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch("/api/xsearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, agent_id: activeAgent?.id }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      setSearchResult(data.result ?? data.error ?? "No result");
    } catch (e) {
      setSearchResult(String(e));
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, activeAgent]);

  function saveSearch() {
    if (!searchResult || !searchQuery) return;
    setSavedSearches((prev) => [
      { query: searchQuery, result: searchResult, savedAt: new Date().toISOString() },
      ...prev,
    ]);
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
      {/* Left panel */}
      <div className="w-[340px] shrink-0 border-r border-border p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Mode
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.mode}
                onClick={() => setMode(p.mode)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs transition-colors",
                  mode === p.mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
                )}
              >
                <p.icon className={cn("w-4 h-4", mode === p.mode && p.color)} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* X-Search mode */}
        {mode === "xsearch" ? (
          <div className="flex flex-col gap-3 flex-1">
            <div className="space-y-2">
              <Label>Search query</Label>
              <Input
                placeholder="What are people saying about…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleXSearch(); }}
              />
            </div>
            <Button onClick={handleXSearch} disabled={!searchQuery.trim() || searchLoading} className="gap-2 w-full">
              {searchLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Searching…</> : <><Search className="w-4 h-4" />Search X</>}
            </Button>

            {/* Saved searches */}
            {savedSearches.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">Saved searches</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {savedSearches.map((s, i) => (
                    <button key={i} onClick={() => { setSearchQuery(s.query); setSearchResult(s.result); }}
                      className="w-full text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-foreground truncate">
                      {s.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Generate mode */
          <div className="flex flex-col gap-3 flex-1">
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                placeholder={`Describe the ${mode} you want to generate…`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleGenerate} disabled={!prompt.trim() || streaming} className="gap-2 w-full">
              {streaming ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Send className="w-4 h-4" />Generate {mode}</>}
            </Button>

            {messages.length > 0 && (
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                {messages[messages.length - 1].content || "…"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {mode === "xsearch" ? (
          <XSearchResult result={searchResult} loading={searchLoading} query={searchQuery} onSave={saveSearch} />
        ) : (
          <OutputGrid outputs={outputs.filter((o) => o.type === mode)} />
        )}
      </div>
    </div>
  );
}

function XSearchResult({ result, loading, query, onSave }: {
  result: string | null;
  loading: boolean;
  query: string;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Search className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium truncate">{query || "X-Search"}</span>
        {result && (
          <Button variant="ghost" size="sm" onClick={onSave} className="ml-auto gap-1.5 text-xs">
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 p-6">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching…
          </div>
        )}
        {!loading && !result && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <Search className="w-8 h-8 opacity-20" />
            <p className="text-sm">Enter a query to search X</p>
          </div>
        )}
        {result && (
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{result}</pre>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function OutputGrid({ outputs }: { outputs: GeneratedOutput[] }) {
  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <ImageIcon className="w-12 h-12 opacity-20" />
        <p className="text-sm">Generated outputs will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-6">
      <div className="grid grid-cols-2 gap-4 auto-rows-min">
        {outputs.map((out, i) => (
          <OutputCard key={i} output={out} />
        ))}
      </div>
    </ScrollArea>
  );
}

function OutputCard({ output }: { output: GeneratedOutput }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {output.url && output.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={output.url} alt={output.prompt} className="w-full aspect-square object-cover" />
      )}
      {output.url && output.type === "video" && (
        <video src={output.url} controls className="w-full aspect-video" />
      )}
      {output.url && output.type === "voice" && (
        <div className="p-4"><audio src={output.url} controls className="w-full" /></div>
      )}
      {output.content && (
        <div className="p-4 max-h-40 overflow-y-auto">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{output.content.slice(0, 300)}</pre>
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-muted-foreground truncate">{output.prompt}</p>
      </div>
    </div>
  );
}
