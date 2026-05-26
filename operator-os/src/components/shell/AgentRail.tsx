"use client";

import { useEffect } from "react";
import { Bot } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useAgentContext } from "@/providers/AgentProvider";
import { AgentRow } from "./AgentRow";
import { AddAgentDialog } from "./AddAgentDialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AgentRail() {
  const { activeAgent, setActiveAgent, setAgents, refreshKey } =
    useAgentContext();
  const { data: agents = [], isLoading } = useAgents(refreshKey);

  // Sync agents into context
  useEffect(() => {
    setAgents(agents);
    // Auto-select first agent if none selected
    if (!activeAgent && agents.length > 0) {
      setActiveAgent(agents[0]);
    }
  }, [agents, activeAgent, setActiveAgent, setAgents]);

  return (
    <aside className="flex flex-col w-[220px] shrink-0 border-r border-border bg-card h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Agents</span>
        {agents.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {agents.length}
          </span>
        )}
      </div>

      {/* Agent list */}
      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading && (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            Loading…
          </div>
        )}
        {!isLoading && agents.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            No agents found
          </div>
        )}
        <div className="space-y-0.5">
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              isActive={activeAgent?.id === agent.id}
              onClick={() => setActiveAgent(agent)}
            />
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Add agent */}
      <div className="px-2 py-2 shrink-0">
        <AddAgentDialog />
      </div>
    </aside>
  );
}
