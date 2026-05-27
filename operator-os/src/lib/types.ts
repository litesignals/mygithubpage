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
  lastChecked?: string;
}

// ─── Chat / Sessions ─────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  session_id: string;
  agent_id: string;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export type WorkspaceBucket =
  | "images"
  | "videos"
  | "voice"
  | "apps"
  | "main"
  | "julian"
  | "marketing"
  | "skills"
  | "goalmode"
  | "sandbox"
  | "downloads"
  | "pastes"
  | "scratch";

export interface BucketMeta {
  id: WorkspaceBucket;
  label: string;
  path: string;
  color: string;
  group: "studio" | "workspace" | "agent";
}

export const BUCKET_DEFS: BucketMeta[] = [
  { id: "images",    label: "Studio · Images",     path: "workspace/studio/images",  color: "#A855F7", group: "studio" },
  { id: "videos",    label: "Studio · Videos",     path: "workspace/studio/videos",  color: "#3B82F6", group: "studio" },
  { id: "voice",     label: "Studio · Voice",      path: "workspace/studio/voice",   color: "#10B981", group: "studio" },
  { id: "apps",      label: "Apps",                path: "workspace/apps",           color: "#F59E0B", group: "workspace" },
  { id: "main",      label: "Main Workspace",      path: "workspace/main",           color: "#6B7280", group: "workspace" },
  { id: "julian",    label: "Julian Workspace",    path: "workspace/julian",         color: "#8B5CF6", group: "workspace" },
  { id: "marketing", label: "Marketing Workspace", path: "workspace/marketing",      color: "#EC4899", group: "workspace" },
  { id: "skills",    label: "Skills",              path: "workspace/skills",         color: "#06B6D4", group: "workspace" },
  { id: "goalmode",  label: "Goal Mode",           path: "workspace/goal-mode",      color: "#84CC16", group: "agent" },
  { id: "sandbox",   label: "Sandbox",             path: "workspace/sandbox",        color: "#F97316", group: "agent" },
  { id: "downloads", label: "Downloads",           path: "workspace/downloads",      color: "#64748B", group: "agent" },
  { id: "pastes",    label: "Pastes",              path: "workspace/pastes",         color: "#78716C", group: "agent" },
  { id: "scratch",   label: "Scratch",             path: "workspace/scratch",        color: "#EAB308", group: "agent" },
];

export interface WorkspaceFile {
  name: string;
  path: string;
  bucket: WorkspaceBucket;
  size: number;
  mtime: string;
  ext: string;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export interface HealthResult {
  agentId: string;
  status: AgentStatus;
  responseMs?: number;
  error?: string;
  checkedAt: string;
}

// ─── Doctor ──────────────────────────────────────────────────────────────────

export interface DoctorCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export interface DoctorResult {
  checks: DoctorCheck[];
  passed: number;
  failed: number;
  runAt: string;
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export interface LogEntry {
  line: string;
  role?: string;
  ts?: string;
}

// ─── Cron ────────────────────────────────────────────────────────────────────

export interface CronJob {
  schedule: string;
  command: string;
  source: string;
}

// ─── Memory ──────────────────────────────────────────────────────────────────

export interface MemoryFile {
  name: string;
  path: string;
  preview: string;
  size: number;
  mtime: string;
}

// ─── Control Room ────────────────────────────────────────────────────────────

export interface AgentStats {
  agentId: string;
  sessionCount: number;
  logLines: string[];
  cronJobs: CronJob[];
}

// ─── API responses ───────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  detail?: string;
}
