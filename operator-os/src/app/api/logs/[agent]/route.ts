import { NextRequest, NextResponse } from "next/server";
import { exists, readFileText } from "@/lib/filesystem";
import type { LogEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { agent: string } }
) {
  const agentId = params.agent;
  const { searchParams } = new URL(req.url);
  const lines = parseInt(searchParams.get("lines") ?? "50");

  const relPath = `sessions/${agentId}.jsonl`;
  const entries: LogEntry[] = [];

  if (exists(relPath)) {
    try {
      const raw = await readFileText(relPath);
      const allLines = raw.split("\n").filter(Boolean);
      const tail = allLines.slice(-lines);

      for (const line of tail) {
        try {
          const parsed = JSON.parse(line) as {
            ts?: string;
            role?: string;
            content?: string;
          };
          entries.push({
            ts: parsed.ts,
            role: parsed.role,
            line: `[${parsed.ts?.slice(0, 19) ?? ""}] [${(parsed.role ?? "?").toUpperCase()}] ${(parsed.content ?? "").slice(0, 200)}`,
          });
        } catch {
          entries.push({ line });
        }
      }
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to read logs", detail: String(e) },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(entries);
}
