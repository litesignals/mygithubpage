"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, CheckCircle2, XCircle, Clock, Heart,
  Terminal, Calendar, Brain, Stethoscope, Users, RefreshCw
} from "lucide-react";
import { useAgentContext } from "@/providers/AgentProvider";
import { useHealth } from "@/hooks/useHealth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import type { Agent, DoctorResult, LogEntry, CronJob, MemoryFile } from "@/lib/types";

type Action = "health" | "agents" | "doctor" | "logs" | "cron" | "memory";

const ACTIONS: { id: Action; label: string; icon: React.ElementType }[] = [
  { id: "health",  label: "Health",  icon: Heart },
  { id: "agents",  label: "Agents",  icon: Users },
  { id: "doctor",  label: "Doctor",  icon: Stethoscope },
  { id: "logs",    label: "Logs",    icon: Terminal },
  { id: "cron",    label: "Cron",    icon: Calendar },
  { id: "memory",  label: "Memory",  icon: Brain },
];

export function ControlRoomTab() {
  const { agents } = useAgentContext();
  const [activeAction, setActiveAction] = useState<Action>("health");

  const onlineCount = agents.length; // health is per-row

  return (
    <div className="flex flex-col h-full">
      {/* Top summary bar */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-border bg-card shrink-0">
        <SummaryChip icon={<Activity className="w-3.5 h-3.5 text-primary" />}
          label="Control Room" value="Live" />
        <SummaryChip icon={<Users className="w-3.5 h-3.5 text-blue-400" />}
          label="Agents" value={String(onlineCount)} />
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground font-mono">
          OPERATOR OS · MISSION CONTROL
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border shrink-0">
        {ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveAction(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
              activeAction === id
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {activeAction === "health"  && <HealthPanel agents={agents} />}
        {activeAction === "agents"  && <AgentsPanel agents={agents} />}
        {activeAction === "doctor"  && <DoctorPanel />}
        {activeAction === "logs"    && <LogsPanel agents={agents} />}
        {activeAction === "cron"    && <CronPanel />}
        {activeAction === "memory"  && <MemoryPanel />}
      </div>
    </div>
  );
}

function SummaryChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

// ── Health Panel ──────────────────────────────────────────────────────────────

function HealthPanel({ agents }: { agents: Agent[] }) {
  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-2xl mx-auto space-y-3">
        {agents.length === 0 && (
          <p className="text-sm text-muted-foreground">No agents registered.</p>
        )}
        {agents.map((agent) => (
          <AgentHealthRow key={agent.id} agent={agent} />
        ))}
      </div>
    </ScrollArea>
  );
}

function AgentHealthRow({ agent }: { agent: Agent }) {
  const { data: health, refetch } = useHealth(agent.id);
  const isOnline = health?.status === "online";
  const isOffline = health?.status === "offline";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      <span className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: agent.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{agent.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{agent.url}</p>
      </div>
      {isOnline ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <Badge variant="success">Online</Badge>
          {health?.responseMs && <span className="text-xs text-muted-foreground">{health.responseMs}ms</span>}
        </div>
      ) : isOffline ? (
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <Badge variant="destructive">Offline</Badge>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          <Badge variant="secondary">Checking…</Badge>
        </div>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
        <RefreshCw className="w-3 h-3" />
      </Button>
      {health?.checkedAt && (
        <span className="text-[10px] text-muted-foreground">{timeAgo(health.checkedAt)}</span>
      )}
    </div>
  );
}

// ── Agents Panel ──────────────────────────────────────────────────────────────

function AgentsPanel({ agents }: { agents: Agent[] }) {
  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-2xl mx-auto space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
              <span className="font-medium text-sm">{agent.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{agent.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
              <div><span className="text-foreground/40">url </span>{agent.url}</div>
              <div><span className="text-foreground/40">chat </span>{agent.chat_endpoint}</div>
              <div><span className="text-foreground/40">health </span>{agent.health_endpoint}</div>
              <div><span className="text-foreground/40">color </span>
                <span style={{ color: agent.color }}>{agent.color}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ── Doctor Panel ──────────────────────────────────────────────────────────────

function DoctorPanel() {
  const [result, setResult] = useState<DoctorResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctor");
      setResult(await res.json() as DoctorResult);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(); }, [run]);

  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-semibold text-sm">System Diagnostics</h3>
          <Button variant="outline" size="sm" onClick={run} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            {loading ? "Running…" : "Re-run"}
          </Button>
          {result && (
            <div className="flex gap-2 ml-auto">
              <Badge variant="success">{result.passed} passed</Badge>
              {result.failed > 0 && <Badge variant="destructive">{result.failed} failed</Badge>}
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-1.5">
            {result.checks.map((check, i) => (
              <div key={i} className={cn(
                "flex items-start gap-3 p-2.5 rounded-lg text-xs",
                check.status === "pass" ? "bg-emerald-950/30" :
                check.status === "fail" ? "bg-red-950/30" : "bg-amber-950/30"
              )}>
                {check.status === "pass" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> :
                 check.status === "fail" ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" /> :
                 <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{check.name}</span>
                  <span className="text-muted-foreground ml-2">{check.detail}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ── Logs Panel ────────────────────────────────────────────────────────────────

function LogsPanel({ agents }: { agents: Agent[] }) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id ?? "");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/logs/${id}?lines=50`);
      setLogs(await res.json() as LogEntry[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (agents[0]?.id) setSelectedAgent(agents[0].id);
  }, [agents]);

  useEffect(() => { fetchLogs(selectedAgent); }, [selectedAgent, fetchLogs]);

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex gap-1">
          {agents.map((a) => (
            <button key={a.id} onClick={() => setSelectedAgent(a.id)}
              className={cn("px-3 py-1 rounded text-xs transition-colors",
                selectedAgent === a.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent")}>
              {a.name}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchLogs(selectedAgent)} disabled={loading} className="ml-auto gap-1">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="flex-1 rounded-xl border border-border bg-black/30 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 font-mono text-[11px] space-y-0.5">
            {logs.length === 0 && (
              <p className="text-muted-foreground">No session logs found for {selectedAgent}.</p>
            )}
            {logs.map((entry, i) => (
              <p key={i} className={cn(
                "leading-relaxed",
                entry.role === "user" ? "text-blue-400" :
                entry.role === "assistant" ? "text-emerald-400" : "text-muted-foreground"
              )}>
                {entry.line}
              </p>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ── Cron Panel ────────────────────────────────────────────────────────────────

function CronPanel() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cron")
      .then((r) => r.json())
      .then((d) => { setJobs(d as CronJob[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Scheduled Jobs</h3>
          <Badge variant="secondary">{jobs.length} job{jobs.length !== 1 ? "s" : ""}</Badge>
        </div>
        {loading && <p className="text-sm text-muted-foreground">Scanning…</p>}
        {!loading && jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No cron jobs found.</p>
        )}
        <div className="space-y-2">
          {jobs.map((job, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card text-xs font-mono">
              <span className="text-amber-400 shrink-0">{job.schedule}</span>
              <span className="flex-1 text-foreground truncate">{job.command}</span>
              <span className="text-muted-foreground/60 shrink-0">{job.source}</span>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Memory Panel ──────────────────────────────────────────────────────────────

function MemoryPanel() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selected, setSelected] = useState<MemoryFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((d) => { setFiles(d as MemoryFile[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-full">
      {/* File list */}
      <div className="w-[260px] shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Vault · {files.length} file{files.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ScrollArea className="flex-1">
          {loading && <p className="text-xs text-muted-foreground px-4 py-3">Loading…</p>}
          <div className="p-2 space-y-0.5">
            {files.map((f) => (
              <button key={f.path} onClick={() => setSelected(f)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                  selected?.path === f.path ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}>
                <p className="font-medium truncate">{f.name.replace(".md", "")}</p>
                <p className="text-[10px] opacity-60 truncate mt-0.5">{f.preview.slice(0, 60)}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ScrollArea className="h-full p-6">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-semibold mb-4">{selected.name}</h3>
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selected.preview}
              </pre>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Select a memory file to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
