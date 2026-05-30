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

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: string) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${data}\n\n`)
        );
      }

      try {
        // Send OpenAI-compatible request body
        const upstreamRes = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
          },
          body: JSON.stringify({
            model: agent.model ?? "gpt-5.4",
            messages: [{ role: "user", content: body.message }],
            stream: true,
            // Legacy fallback fields some agents expect
            message: body.message,
            session_id: sessionId,
          }),
        });

        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text().catch(() => "");
          send(
            "error",
            JSON.stringify({ error: `Agent returned ${upstreamRes.status}`, detail: errText })
          );
          controller.close();
          return;
        }

        const contentType = upstreamRes.headers.get("content-type") ?? "";

        if (contentType.includes("text/event-stream")) {
          // SSE stream — could be OpenAI format or our own format
          const reader = upstreamRes.body?.getReader();
          if (!reader) {
            send("error", JSON.stringify({ error: "No response body" }));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;

              // Our own format: "event: token" / "event: done" / "event: error"
              if (trimmed.startsWith("event:")) continue; // handled on next line

              if (trimmed.startsWith("data:")) {
                const raw = trimmed.slice(5).trim();
                if (raw === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(raw) as Record<string, unknown>;

                  // OpenAI chunk format
                  const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
                  const delta = choices?.[0]?.delta as Record<string, unknown> | undefined;
                  const deltaContent = delta?.content;

                  if (typeof deltaContent === "string") {
                    send("token", JSON.stringify({ content: deltaContent }));
                    continue;
                  }

                  // Our own event already: { content } or { error } or { session_id }
                  if ("content" in parsed && typeof parsed.content === "string") {
                    send("token", JSON.stringify({ content: parsed.content }));
                  } else if ("error" in parsed) {
                    send("error", raw);
                  } else if ("session_id" in parsed) {
                    send("done", raw);
                  }
                } catch {
                  // Plain text chunk — pass as token
                  if (raw) send("token", JSON.stringify({ content: raw }));
                }
              }
            }
          }
        } else {
          // Non-streaming JSON response
          const text = await upstreamRes.text();
          let content = text;
          try {
            const json = JSON.parse(text) as Record<string, unknown>;
            const choices = json.choices as Array<Record<string, unknown>> | undefined;
            content =
              (choices?.[0]?.message as Record<string, unknown>)?.content as string ??
              (choices?.[0]?.text as string) ??
              (json.content as string) ??
              (json.message as string) ??
              (json.response as string) ??
              (json.text as string) ??
              text;
          } catch {
            // plain text is fine
          }
          send("token", JSON.stringify({ content }));
        }

        send("done", JSON.stringify({ session_id: sessionId }));
      } catch (err) {
        send("error", JSON.stringify({ error: "Failed to reach agent", detail: String(err) }));
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
