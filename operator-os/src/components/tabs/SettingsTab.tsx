"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Server, Cpu, Terminal,
  RefreshCw, Trash2, CheckCircle2, XCircle,
  ChevronRight, Zap, FolderOpen, Plug, AlertCircle, CheckCheck,
  Loader2
} from "lucide-react";
import { useAgentContext } from "@/providers/AgentProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatBytes } from "@/lib/utils";
import type { Agent } from "@/lib/types";
import type { SystemInfo, Pm2Proc } from "@/app/api/system/route";

type Section = "backend" | "system" | "agents" | "about";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "backend", label: "Backend",  icon: Plug },
  { id: "system",  label: "System",   icon: Server },
  { id: "agents",  label: "Agents",   icon: Zap },
  { id: "about",   label: "About",    icon: Settings },
];

export function SettingsTab() {
  const [active, setActive] = useState<Section>("backend");

  return (
    <div className="flex flex-col sm:flex-row h-full">
      {/* Sidebar nav — horizontal scroll on mobile, vertical on desktop */}
      <nav className="flex sm:flex-col sm:w-[180px] sm:shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-card sm:pt-3 gap-0.5 px-2 sm:px-2 py-2 sm:py-0 overflow-x-auto shrink-0">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0",
              active === id
                ? "bg-primary/15 text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Panel */}
      <div className="flex-1 overflow-hidden min-h-0">
        {active === "backend" && <BackendPanel />}
        {active === "system"  && <SystemPanel />}
        {active === "agents"  && <AgentsPanel />}
        {active === "about"   && <AboutPanel />}
      </div>
    </div>
  );
}

// ── Backend Connection Panel ──────────────────────────────────────────────────

function BackendPanel() {
  const { agents, triggerRefresh } = useAgentContext();
  const hermes = agents.find((a) => a.id === "hermes") ?? agents[0];

  const [testResult, setTestResult] = useState<{
    ok: boolean;
    status?: number;
    ms?: number;
    error?: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  async function testConnection() {
    if (!hermes) return;
    setTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const url = `${hermes.url}${hermes.health_endpoint}`;
      const res = await fetch(`/api/health/${hermes.id}`);
      const data = await res.json() as { status?: string; error?: string };
      const ms = Date.now() - start;
      setTestResult({ ok: data.status === "online", ms, status: res.status, error: data.error });
    } catch (e) {
      setTestResult({ ok: false, error: String(e) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <ScrollArea className="h-full p-4 sm:p-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div>
          <h2 className="text-base font-semibold mb-1">Backend Connection</h2>
          <p className="text-xs text-muted-foreground">
            Operator OS talks to your Hermes agent over HTTP. Because both run on the
            same VPS, the connection goes direct to the internal port — no Cloudflare
            or basic-auth proxy in the way.
          </p>
        </div>

        {/* Current config */}
        <Card title="Active Configuration" icon={<Plug className="w-3.5 h-3.5" />}>
          {hermes ? (
            <>
              <StatRow label="Agent name" value={hermes.name} />
              <StatRow label="Base URL" value={hermes.url} mono />
              <StatRow label="Chat endpoint" value={hermes.chat_endpoint} mono />
              <StatRow label="Health endpoint" value={hermes.health_endpoint} mono />
              <StatRow label="Model" value={hermes.model ?? "(not set)"} mono />
              <div className="px-4 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testConnection}
                  disabled={testing}
                  className="gap-2"
                >
                  {testing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Plug className="w-3.5 h-3.5" />}
                  Test connection
                </Button>
                {testResult && (
                  <div className={cn(
                    "mt-2.5 flex items-center gap-2 text-xs rounded-lg px-3 py-2",
                    testResult.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {testResult.ok
                      ? <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {testResult.ok
                      ? `Connected — ${testResult.ms}ms`
                      : `Failed: ${testResult.error ?? `HTTP ${testResult.status}`}`}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              No agents registered. Add one using the sidebar.
            </div>
          )}
        </Card>

        {/* How to connect */}
        <Card title="How to Connect Hermes" icon={<AlertCircle className="w-3.5 h-3.5" />}>
          <div className="px-4 py-3 space-y-3 text-xs text-muted-foreground">
            <p>
              Hermes gateway runs on port <code className="font-mono bg-muted px-1 rounded">9119</code> inside
              the Docker container. From this server (port 3737) you can reach it directly:
            </p>
            <CodeBlock code={`# Default (set in Agent Registry → Agents tab)
URL:              http://127.0.0.1:9119
Chat endpoint:    /v1/chat/completions
Health endpoint:  /health
Model:            gpt-5.4`} />
            <p>
              If <strong className="text-foreground">/v1/chat/completions</strong> returns 404, try one of these alternate endpoints and update the agent in Settings → Agents:
            </p>
            <CodeBlock code={`/api/chat/completions   ← Open WebUI style
/chat                   ← simple POST {message}
/api/chat               ← alternate gateway path`} />
            <p>
              To use <strong className="text-foreground">Open WebUI</strong> (port 8080) instead:
            </p>
            <CodeBlock code={`URL:           http://127.0.0.1:8080
Chat endpoint: /api/chat/completions
Health:        /api/version`} />
          </div>
        </Card>

        {/* External URL note */}
        <Card title="External Access" icon={<Server className="w-3.5 h-3.5" />}>
          <div className="px-4 py-3 space-y-2 text-xs text-muted-foreground">
            <p>
              The dashboard itself is accessible at{" "}
              <code className="font-mono bg-muted px-1 rounded">os.ryanmeza.com</code>.
              Hermes native UI is at{" "}
              <code className="font-mono bg-muted px-1 rounded">agent.ryanmeza.com</code>{" "}
              (requires login: <code className="font-mono bg-muted px-1 rounded">zero_cool</code>).
            </p>
            <p>
              The internal URL is used server-side only — it never leaves the VPS.
            </p>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}

// ── System Panel ──────────────────────────────────────────────────────────────

function SystemPanel() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system");
      setInfo(await res.json() as SystemInfo);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollArea className="h-full p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">System Info</h2>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 ml-auto">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {!info && loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {info && (
          <>
            <Card title="Resources" icon={<Cpu className="w-3.5 h-3.5" />}>
              <StatRow label="CPU / Memory" value={`– / ${info.memory}`} />
              <StatRow label="Disk" value={info.disk} />
              <StatRow label="Uptime" value={info.uptime} />
            </Card>

            <Card title="Runtime" icon={<Terminal className="w-3.5 h-3.5" />}>
              <StatRow label="Node.js" value={info.node} />
              <StatRow label="npm" value={info.npm} />
              <StatRow label="Python" value={info.python} />
              <StatRow label="PM2" value={info.pm2} />
            </Card>

            <Card title="Filesystem" icon={<FolderOpen className="w-3.5 h-3.5" />}>
              <StatRow label="agent-os root" value={info.agentOsRoot} mono />
              <StatRow label="Root exists" value={info.agentOsExists ? "Yes ✓" : "No — run bin/init.sh"} />
              <StatRow label="Registered agents" value={String(info.agentCount)} />
            </Card>

            <Card title="Environment" icon={<Settings className="w-3.5 h-3.5" />}>
              {Object.entries(info.env).map(([k, v]) => (
                <StatRow key={k} label={k} value={v} mono />
              ))}
            </Card>

            {info.pm2Procs.length > 0 && (
              <Card title="PM2 Processes" icon={<Server className="w-3.5 h-3.5" />}>
                <div className="space-y-2 px-4 py-3">
                  {info.pm2Procs.map((proc) => (
                    <Pm2Row key={proc.name} proc={proc} />
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/50">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

function StatRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5 gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-xs text-foreground text-right break-all", mono && "font-mono")}>{value}</span>
    </div>
  );
}

function Pm2Row({ proc }: { proc: Pm2Proc }) {
  const isOnline = proc.status === "online";
  return (
    <div className="flex items-center gap-3">
      {isOnline
        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
      <span className="text-xs font-medium flex-1">{proc.name}</span>
      <Badge variant={isOnline ? "success" : "destructive"} className="text-[10px]">
        {proc.status}
      </Badge>
      {isOnline && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {formatBytes(proc.memory)} · {proc.cpu}%
        </span>
      )}
    </div>
  );
}

// ── Agents Panel ──────────────────────────────────────────────────────────────

function AgentsPanel() {
  const { agents, triggerRefresh } = useAgentContext();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<Agent | null>(null);

  async function deleteAgent(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      triggerRefresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <ScrollArea className="h-full p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Agent Registry</h2>
          <Badge variant="secondary" className="ml-auto">{agents.length} registered</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Persisted to <code className="font-mono bg-muted px-1 rounded">~/agent-os/config/agents.json</code>.
          Edit the URL/endpoint here to switch backends.
        </p>

        <div className="space-y-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={() => deleteAgent(agent.id)}
              deleting={deleting === agent.id}
              onEdit={() => setEditing(agent)}
            />
          ))}
        </div>

        {agents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground border border-dashed border-border rounded-xl">
            <Zap className="w-6 h-6 opacity-30" />
            <p className="text-sm">No agents registered yet.</p>
            <p className="text-xs opacity-60">Use "Add agent" in the sidebar.</p>
          </div>
        )}

        {editing && (
          <EditAgentCard
            agent={editing}
            onDone={() => { setEditing(null); triggerRefresh(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>
    </ScrollArea>
  );
}

function AgentCard({ agent, onDelete, deleting, onEdit }: {
  agent: Agent;
  onDelete: () => void;
  deleting: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: agent.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{agent.name}</span>
            <span className="text-xs text-muted-foreground font-mono">{agent.id}</span>
          </div>
          <div className="space-y-0.5 text-xs font-mono text-muted-foreground">
            <div><span className="opacity-50">url </span><span className="break-all">{agent.url}</span></div>
            <div><span className="opacity-50">chat </span>{agent.chat_endpoint}</div>
            <div><span className="opacity-50">model </span>{agent.model ?? "—"}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditAgentCard({ agent, onDone, onCancel }: {
  agent: Agent;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...agent });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  const COLORS = ["#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#06B6D4","#84CC16"];

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-medium">Edit: {agent.name}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {(["name","url","chat_endpoint","health_endpoint","model"] as const).map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-muted-foreground">{field}</label>
            <input
              className="w-full bg-input border border-border rounded px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              value={(form[field] as string) ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {COLORS.map((c) => (
          <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
            className="w-6 h-6 rounded-full border-2 transition-all"
            style={{ backgroundColor: c, borderColor: form.color === c ? "white" : "transparent" }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── About Panel ───────────────────────────────────────────────────────────────

function AboutPanel() {
  return (
    <ScrollArea className="h-full p-4 sm:p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Operator OS</h2>
          <p className="text-sm text-muted-foreground">
            Mission Control dashboard for orchestrating AI agents.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <InfoRow label="Stack" value="Next.js 14 · TypeScript · Tailwind" />
          <InfoRow label="Port" value="3737" />
          <InfoRow label="State" value="Filesystem (~/agent-os/**)" />
          <InfoRow label="Streaming" value="Server-Sent Events (SSE)" />
          <InfoRow label="Agent format" value="OpenAI-compatible" />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick start</p>
          <CodeBlock code={`# Init filesystem\nbash bin/init.sh\n\n# Open dashboard\nopen http://localhost:3737`} />
        </div>

        <div className="text-xs text-muted-foreground/50 space-y-1">
          <p>Based on Agent OS by Julian Goldie · agentos.guide</p>
          <p>Built with Claude Code · Anthropic</p>
        </div>
      </div>
    </ScrollArea>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-foreground font-mono text-xs">{value}</span>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed bg-black/20 rounded-lg p-3 overflow-x-auto">
      {code}
    </pre>
  );
}
