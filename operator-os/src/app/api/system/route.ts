import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { getAgentOsRoot } from "@/lib/filesystem";
import { readAgents } from "@/lib/agentRegistry";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

function safeExec(cmd: string, fallback = "–"): string {
  try {
    return execSync(cmd, { timeout: 3000 }).toString().trim();
  } catch {
    return fallback;
  }
}

export interface Pm2Proc {
  name: string;
  status: string;
  pid: number;
  uptime: number;
  cpu: number;
  memory: number;
}

export interface SystemInfo {
  agentOsRoot: string;
  agentOsExists: boolean;
  agentCount: number;
  node: string;
  npm: string;
  python: string;
  pm2: string;
  uptime: string;
  disk: string;
  memory: string;
  pm2Procs: Pm2Proc[];
  env: Record<string, string>;
}

export async function GET() {
  const root = getAgentOsRoot();
  const agents = await readAgents().catch(() => []);

  const pm2List = safeExec("pm2 jlist 2>/dev/null", "[]");
  let pm2Procs: Pm2Proc[] = [];
  try {
    const raw = JSON.parse(pm2List) as Array<{
      name: string;
      pm2_env: { status: string; pm_uptime: number };
      pid: number;
      monit: { cpu: number; memory: number };
    }>;
    pm2Procs = raw.map((p) => ({
      name: p.name,
      status: p.pm2_env.status,
      pid: p.pid,
      uptime: p.pm2_env.pm_uptime,
      cpu: p.monit?.cpu ?? 0,
      memory: p.monit?.memory ?? 0,
    }));
  } catch {
    // pm2 not running or not installed
  }

  const info: SystemInfo = {
    agentOsRoot: root,
    agentOsExists: existsSync(root),
    agentCount: agents.length,
    node: safeExec("node --version"),
    npm: safeExec("npm --version"),
    python: safeExec("python3 --version 2>&1 || python --version 2>&1"),
    pm2: safeExec("pm2 --version 2>/dev/null"),
    uptime: safeExec("uptime -p 2>/dev/null || uptime"),
    disk: safeExec("df -h / 2>/dev/null | awk 'NR==2{print $3\"/\"$2\" (\"$5\" used)\"}'"),
    memory: safeExec("free -h 2>/dev/null | awk '/^Mem:/{print $3\"/\"$2}'"),
    pm2Procs,
    env: {
      AI_PROVIDER: process.env.AI_PROVIDER ?? "–",
      AGENT_OS_HOME: process.env.AGENT_OS_HOME ?? "(default ~/agent-os)",
      NODE_ENV: process.env.NODE_ENV ?? "–",
    },
  };

  return NextResponse.json(info);
}
