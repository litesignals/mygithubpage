import { NextRequest, NextResponse } from "next/server";
import { readAgents, writeAgents } from "@/lib/agentRegistry";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agents = await readAgents();
    const filtered = agents.filter((a) => a.id !== params.id);

    if (filtered.length === agents.length) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await writeAgents(filtered);
    return NextResponse.json({ ok: true, deleted: params.id });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete agent", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const agents = await readAgents();
    const idx = agents.findIndex((a) => a.id === params.id);

    if (idx < 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    agents[idx] = { ...agents[idx], ...body };
    await writeAgents(agents);
    return NextResponse.json(agents[idx]);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update agent", detail: String(err) },
      { status: 500 }
    );
  }
}
