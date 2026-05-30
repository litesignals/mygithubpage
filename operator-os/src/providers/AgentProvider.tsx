"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Agent } from "@/lib/types";

interface AgentContextValue {
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent | null) => void;
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <AgentContext.Provider
      value={{
        activeAgent,
        setActiveAgent,
        agents,
        setAgents,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgentContext must be used inside AgentProvider");
  return ctx;
}
