"use client";

import { useQuery } from "react-query";
import type { HealthResult } from "@/lib/types";

async function pingAgent(agentId: string): Promise<HealthResult> {
  try {
    const res = await fetch(`/api/health/${agentId}`);
    if (!res.ok) {
      return {
        agentId,
        status: "offline",
        error: `HTTP ${res.status}`,
        checkedAt: new Date().toISOString(),
      };
    }
    return res.json() as Promise<HealthResult>;
  } catch (err) {
    return {
      agentId,
      status: "offline",
      error: String(err),
      checkedAt: new Date().toISOString(),
    };
  }
}

export function useHealth(agentId: string | undefined, enabled = true) {
  return useQuery<HealthResult, Error>(
    ["health", agentId],
    () => pingAgent(agentId!),
    {
      enabled: !!agentId && enabled,
      refetchInterval: 10_000,
      staleTime: 9_000,
      retry: 0, // don't retry — offline is offline
    }
  );
}
