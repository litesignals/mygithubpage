import { NextRequest, NextResponse } from "next/server";
import { exists, readFileText } from "@/lib/filesystem";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { agent: string } }
) {
  const agentId = params.agent;
  const relPath = `sessions/${agentId}.jsonl`;

  if (!exists(relPath)) {
    return NextResponse.json([]);
  }

  try {
    const raw = await readFileText(relPath);
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const messages: ChatMessage[] = [];
    for (const line of lines) {
      try {
        const msg = JSON.parse(line) as ChatMessage;
        messages.push(msg);
      } catch {
        // skip malformed lines
      }
    }

    return NextResponse.json(messages);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read session", detail: String(err) },
      { status: 500 }
    );
  }
}
