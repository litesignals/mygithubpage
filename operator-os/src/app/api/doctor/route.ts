import { NextResponse } from "next/server";
import { getAgentOsRoot, exists, listDir } from "@/lib/filesystem";
import { readAgents } from "@/lib/agentRegistry";
import type { DoctorResult, DoctorCheck } from "@/lib/types";
import { BUCKET_DEFS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: DoctorCheck[] = [];
  const root = getAgentOsRoot();

  // 1. Root dir
  checks.push({
    name: "agent-os root",
    status: exists("") ? "pass" : "fail",
    detail: root,
  });

  // 2. All bucket dirs
  for (const def of BUCKET_DEFS) {
    checks.push({
      name: `dir: ${def.label}`,
      status: exists(def.path) ? "pass" : "warn",
      detail: def.path,
    });
  }

  // 3. agents.json
  const agentsOk = exists("config/agents.json");
  checks.push({
    name: "config/agents.json",
    status: agentsOk ? "pass" : "fail",
    detail: agentsOk ? "found" : "missing — run bin/init.sh",
  });

  // 4. Parse agents
  let agents: Awaited<ReturnType<typeof readAgents>> = [];
  try {
    agents = await readAgents();
    checks.push({
      name: "agents.json parse",
      status: "pass",
      detail: `${agents.length} agent(s) registered`,
    });
  } catch (e) {
    checks.push({
      name: "agents.json parse",
      status: "fail",
      detail: String(e),
    });
  }

  // 5. Ping each agent health
  for (const agent of agents) {
    const url = `${agent.url}${agent.health_endpoint}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      checks.push({
        name: `health: ${agent.name}`,
        status: res.ok ? "pass" : "warn",
        detail: `${url} → HTTP ${res.status}`,
      });
    } catch (e) {
      checks.push({
        name: `health: ${agent.name}`,
        status: "fail",
        detail: `${url} → ${String(e).slice(0, 80)}`,
      });
    }
  }

  // 6. Sessions dir
  try {
    const sessions = await listDir("sessions");
    checks.push({
      name: "sessions dir",
      status: "pass",
      detail: `${sessions.filter((e) => e.isFile()).length} session file(s)`,
    });
  } catch {
    checks.push({ name: "sessions dir", status: "warn", detail: "empty or missing" });
  }

  // 7. Vault dir
  try {
    const vault = await listDir("vault");
    checks.push({
      name: "vault dir",
      status: "pass",
      detail: `${vault.filter((e) => e.isFile()).length} memory file(s)`,
    });
  } catch {
    checks.push({ name: "vault dir", status: "warn", detail: "empty or missing" });
  }

  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;

  const result: DoctorResult = {
    checks,
    passed,
    failed,
    runAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
