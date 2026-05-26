// ─── Agent Registry ──────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  url: string;
  chat_endpoint: string;
  health_endpoint: string;
  color: string;
}

export type AgentStatus = "online" | "offline" | "unknown";

export interface AgentWithStatus extends Agent {
  status: AgentStatus;
  lastChecked?: string; // ISO timestamp
}

// ─── Chat / Sessions ─────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO
  session_id: string;
  agent_id: string;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export type WorkspaceBucket =
  | "images"
  | "videos"
  | "apps"
  | "scratch";

export interface WorkspaceFile {
  name: string;
  path: string; // relative to agent-os root
  bucket: WorkspaceBucket;
  size: number;
  mtime: string; // ISO
  ext: string;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export interface HealthResult {
  agentId: string;
  status: AgentStatus;
  responseMs?: number;
  error?: string;
  checkedAt: string; // ISO
}

// ─── Control Room ────────────────────────────────────────────────────────────

export interface AgentStats {
  agentId: string;
  sessionCount: number;
  logLines: string[];
  cronJobs: CronJob[];
}

export interface CronJob {
  schedule: string;
  command: string;
  source: string; // filename it was found in
}

// ─── API responses ───────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  detail?: string;
}
