import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agentRegistry";
import type { HealthResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { agent: string } }
) {
  const agentId = params.agent;
  const checkedAt = new Date().toISOString();

  const agent = await getAgent(agentId);
  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 }
    );
  }

  const targetUrl = agent.health_url ?? `${agent.url}${agent.health_endpoint}`;
  const t0 = Date.now();

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const responseMs = Date.now() - t0;

    if (res.ok) {
      const result: HealthResult = {
        agentId,
        status: "online",
        responseMs,
        checkedAt,
      };
      return NextResponse.json(result);
    } else {
      const result: HealthResult = {
        agentId,
        status: "offline",
        responseMs,
        error: `HTTP ${res.status}`,
        checkedAt,
      };
      return NextResponse.json(result);
    }
  } catch (err) {
    const result: HealthResult = {
      agentId,
      status: "offline",
      error: String(err),
      checkedAt,
    };
    return NextResponse.json(result);
  }
}
