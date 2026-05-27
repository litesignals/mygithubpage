import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agentRegistry";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { query, agent_id } = (await req.json()) as {
    query: string;
    agent_id?: string;
  };

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // If xAI key available, use Grok directly
  const xaiKey = process.env.XAI_API_KEY;
  if (xaiKey) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xaiKey}`,
        },
        body: JSON.stringify({
          model: "grok-3",
          messages: [
            {
              role: "system",
              content:
                "You are a real-time X/Twitter search assistant. Return a structured answer with cited sources, key posts, and a brief synthesis. Format with markdown.",
            },
            { role: "user", content: `Search X for: ${query}` },
          ],
          search_parameters: { mode: "on" },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices: { message: { content: string } }[];
        };
        return NextResponse.json({
          result: data.choices[0]?.message?.content ?? "",
          source: "grok",
        });
      }
    } catch { /* fall through to agent */ }
  }

  // Fallback: route through active agent
  const agentId = agent_id ?? "hermes";
  const agent = await getAgent(agentId);

  if (!agent) {
    return NextResponse.json({ error: "No agent available for search" }, { status: 503 });
  }

  try {
    const prompt = `You are a search assistant. Search for and summarize information about: "${query}". Format your response in markdown with sections: Summary, Key Points, and Sources (if known).`;

    const res = await fetch(`${agent.url}${agent.chat_endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, session_id: "xsearch" }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Agent returned ${res.status}` }, { status: 502 });
    }

    // Collect SSE or JSON
    const contentType = res.headers.get("content-type") ?? "";
    let result = "";

    if (contentType.includes("text/event-stream")) {
      const text = await res.text();
      for (const line of text.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const d = JSON.parse(line.slice(6)) as { content?: string };
            if (d.content) result += d.content;
          } catch { /* skip */ }
        }
      }
    } else {
      const text = await res.text();
      try {
        const j = JSON.parse(text) as Record<string, unknown>;
        result = (j.content ?? j.message ?? j.response ?? text) as string;
      } catch {
        result = text;
      }
    }

    return NextResponse.json({ result, source: agentId });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
