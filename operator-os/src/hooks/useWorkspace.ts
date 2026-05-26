"use client";

import { useQuery } from "react-query";
import type { WorkspaceBucket, WorkspaceFile } from "@/lib/types";

async function fetchFiles(bucket?: WorkspaceBucket): Promise<WorkspaceFile[]> {
  const url = bucket
    ? `/api/workspace/list?bucket=${bucket}`
    : "/api/workspace/list";
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json() as Promise<WorkspaceFile[]>;
}

export function useWorkspace(bucket?: WorkspaceBucket, enabled = true) {
  return useQuery<WorkspaceFile[], Error>(
    ["workspace", bucket ?? "all"],
    () => fetchFiles(bucket),
    {
      enabled,
      staleTime: 5_000,
      refetchInterval: 6_000,
    }
  );
}
