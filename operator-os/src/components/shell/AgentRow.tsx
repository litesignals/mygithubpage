"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useHealth } from "@/hooks/useHealth";
import { timeAgo, cn } from "@/lib/utils";
import { useAgentContext } from "@/providers/AgentProvider";
import type { Agent } from "@/lib/types";

interface AgentRowProps {
  agent: Agent;
  isActive: boolean;
  onClick: () => void;
}

export function AgentRow({ agent, isActive, onClick }: AgentRowProps) {
  const { data: health } = useHealth(agent.id);
  const { triggerRefresh, setActiveAgent, agents } = useAgentContext();
  const [deleting, setDeleting] = useState(false);

  const statusColor =
    health?.status === "online"
      ? "bg-emerald-400"
      : health?.status === "offline"
      ? "bg-red-500"
      : "bg-zinc-500 animate-none";

  const isPulsing = health?.status === "online";

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove "${agent.name}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      // Select another agent if this one was active
      if (isActive) {
        const next = agents.find((a) => a.id !== agent.id) ?? null;
        setActiveAgent(next);
      }
      triggerRefresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group",
        isActive
          ? "bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {/* Color chip */}
      <span
        className="w-1 h-6 rounded-full shrink-0"
        style={{ backgroundColor: agent.color }}
      />

      {/* Name + last active */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">
          {agent.name}
        </p>
        {health?.checkedAt && (
          <p className="text-[10px] text-muted-foreground/60 leading-tight">
            {timeAgo(health.checkedAt)}
          </p>
        )}
      </div>

      {/* Delete button — visible on hover */}
      <span
        onClick={handleDelete}
        role="button"
        aria-label="Remove agent"
        className={cn(
          "w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-destructive",
          deleting && "opacity-100"
        )}
      >
        <Trash2 className="w-3 h-3" />
      </span>

      {/* Status dot */}
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0 transition-colors",
          statusColor,
          isPulsing && "animate-pulse"
        )}
        title={health?.status ?? "unknown"}
      />
    </button>
  );
}
