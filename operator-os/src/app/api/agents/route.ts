import { NextRequest, NextResponse } from "next/server";
import { readAgents, upsertAgent } from "@/lib/agentRegistry";
import type { Agent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const agents = await readAgents();
    return NextResponse.json(agents);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read agents", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Agent>;

    if (!body.id || !body.name || !body.url) {
      return NextResponse.json(
        { error: "id, name, and url are required" },
        { status: 400 }
      );
    }

    const agent: Agent = {
      id: body.id.trim().toLowerCase().replace(/\s+/g, "-"),
      name: body.name.trim(),
      url: body.url.trim().replace(/\/$/, ""),
      chat_endpoint: body.chat_endpoint ?? "/chat",
      health_endpoint: body.health_endpoint ?? "/health",
      color: body.color ?? "#6B7280",
    };

    const updated = await upsertAgent(agent);
    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save agent", detail: String(err) },
      { status: 500 }
    );
  }
}
