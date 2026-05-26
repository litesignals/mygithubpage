"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Terminal,
  Calendar,
} from "lucide-react";
import { useAgentContext } from "@/providers/AgentProvider";
import { useHealth } from "@/hooks/useHealth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import type { Agent, AgentStats } from "@/lib/types";

export function ControlRoomTab() {
  const { agents } = useAgentContext();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Control Room</h1>
          <span className="text-sm text-muted-foreground">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
          </span>
        </div>

        {agents.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No agents registered. Add one from the sidebar.
          </p>
        )}

        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const { data: health } = useHealth(agent.id);
  const [stats, setStats] = useState<AgentStats | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [sessRes] = await Promise.all([
          fetch(`/api/sessions/${agent.id}`),
        ]);
        const sessions = sessRes.ok
          ? ((await sessRes.json()) as Array<{ role: string; content: string }>)
          : [];

        setStats({
          agentId: agent.id,
          sessionCount: sessions.length,
          logLines: sessions
            .slice(-50)
            .map(
              (m) =>
                `[${m.role.toUpperCase()}] ${m.content.slice(0, 120)}${m.content.length > 120 ? "…" : ""}`
            ),
          cronJobs: [],
        });
      } catch {
        setStats({
          agentId: agent.id,
          sessionCount: 0,
          logLines: [],
          cronJobs: [],
        });
      }
    }
    load();
  }, [agent.id]);

  const isOnline = health?.status === "online";
  const isOffline = health?.status === "offline";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-border"
        style={{ borderLeftWidth: 3, borderLeftColor: agent.color }}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: agent.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{agent.name}</h3>
            <span className="text-xs text-muted-foreground font-mono">
              {agent.id}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{agent.url}</p>
        </div>

        {/* Health badge */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <Badge variant="success">Online</Badge>
              {health?.responseMs && (
                <span className="text-xs text-muted-foreground">
                  {health.responseMs}ms
                </span>
              )}
            </>
          ) : isOffline ? (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <Badge variant="destructive">Offline</Badge>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-zinc-500" />
              <Badge variant="secondary">Unknown</Badge>
            </>
          )}
        </div>

        {health?.checkedAt && (
          <span className="text-[10px] text-muted-foreground">
            checked {timeAgo(health.checkedAt)}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <StatCell
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Status"
          value={health?.status ?? "—"}
          valueClass={cn(
            isOnline
              ? "text-emerald-400"
              : isOffline
              ? "text-red-400"
              : "text-zinc-400"
          )}
        />
        <StatCell
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          label="Session messages"
          value={String(stats?.sessionCount ?? "—")}
        />
        <StatCell
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Cron jobs"
          value={String(stats?.cronJobs.length ?? 0)}
        />
      </div>

      {/* Last 50 log lines */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Session log (last 50 messages)
          </span>
        </div>

        {(!stats || stats.logLines.length === 0) ? (
          <p className="text-xs text-muted-foreground italic px-1">
            No session history found for this agent.
          </p>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-0.5 font-mono text-[11px]">
              {stats.logLines.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    "px-2 py-0.5 rounded",
                    line.startsWith("[USER]")
                      ? "text-primary/80"
                      : line.startsWith("[ASSISTANT]")
                      ? "text-emerald-400/80"
                      : "text-muted-foreground"
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Cron jobs (if any) */}
      {stats && stats.cronJobs.length > 0 && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Cron jobs
            </span>
          </div>
          <div className="space-y-1">
            {stats.cronJobs.map((job, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-xs font-mono bg-muted rounded px-2 py-1"
              >
                <span className="text-amber-400">{job.schedule}</span>
                <span className="text-foreground flex-1 truncate">
                  {job.command}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {job.source}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error detail */}
      {isOffline && health?.error && (
        <div className="px-4 pb-4">
          <p className="text-xs text-destructive font-mono">
            {health.error}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn("text-sm font-semibold", valueClass)}>{value}</span>
    </div>
  );
}
