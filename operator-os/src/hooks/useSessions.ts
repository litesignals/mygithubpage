"use client";

import { useQuery } from "react-query";
import type { ChatMessage } from "@/lib/types";

async function fetchSessions(agentId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/sessions/${agentId}`);
  if (!res.ok) return [];
  return res.json() as Promise<ChatMessage[]>;
}

export function useSessions(agentId: string | undefined) {
  return useQuery<ChatMessage[], Error>(
    ["sessions", agentId],
    () => fetchSessions(agentId!),
    {
      enabled: !!agentId,
      staleTime: 2_000,
      refetchInterval: 5_000,
    }
  );
}
