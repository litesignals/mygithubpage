"use client";

import { useHealth } from "@/hooks/useHealth";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";

interface AgentRowProps {
  agent: Agent;
  isActive: boolean;
  onClick: () => void;
}

export function AgentRow({ agent, isActive, onClick }: AgentRowProps) {
  const { data: health } = useHealth(agent.id);

  const statusColor =
    health?.status === "online"
      ? "bg-emerald-400"
      : health?.status === "offline"
      ? "bg-red-500"
      : "bg-zinc-500";

  const isPulsing = health?.status === "online";

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
