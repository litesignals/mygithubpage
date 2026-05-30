"use client";

import { useQuery } from "react-query";
import type { Agent } from "@/lib/types";

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json() as Promise<Agent[]>;
}

export function useAgents(refreshKey?: number) {
  return useQuery<Agent[], Error>(["agents", refreshKey], fetchAgents, {
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}
