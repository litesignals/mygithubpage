import { NextRequest } from "next/server";
import { getAgent } from "@/lib/agentRegistry";

export const dynamic = "force-dynamic";

interface ChatBody {
  message: string;
  session_id?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { agent: string } }
) {
  const agentId = params.agent;

  // ── Look up agent ─────────────────────────────────────────────────────────
  const agent = await getAgent(agentId);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await req.json()) as ChatBody;
  if (!body.message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = body.session_id ?? `${agentId}-${Date.now()}`;
  const targetUrl = `${agent.url}${agent.chat_endpoint}`;

  // ── SSE stream ────────────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: string) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${data}\n\n`)
        );
      }

      try {
        // Forward to agent
        const upstreamRes = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            message: body.message,
            session_id: sessionId,
          }),
          // Node 18+ fetch supports signal; omit for simplicity
        });

        if (!upstreamRes.ok) {
          send(
            "error",
            JSON.stringify({
              error: `Agent returned ${upstreamRes.status}`,
            })
          );
          controller.close();
          return;
        }

        const contentType = upstreamRes.headers.get("content-type") ?? "";

        if (contentType.includes("text/event-stream")) {
          // Proxy the SSE stream
          const reader = upstreamRes.body?.getReader();
          if (!reader) {
            send("error", JSON.stringify({ error: "No response body" }));
            controller.close();
            return;
          }
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Pass through raw SSE chunks
            controller.enqueue(value);
          }
        } else {
          // JSON or text response — emit as single token event
          const text = await upstreamRes.text();
          let content = text;
          try {
            const json = JSON.parse(text) as Record<string, unknown>;
            content =
              (json.content as string) ??
              (json.message as string) ??
              (json.response as string) ??
              text;
          } catch {
            // plain text is fine
          }
          send("token", JSON.stringify({ content }));
        }

        send("done", JSON.stringify({ session_id: sessionId }));
      } catch (err) {
        send(
          "error",
          JSON.stringify({
            error: "Failed to reach agent",
            detail: String(err),
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Session-Id": sessionId,
    },
  });
}
