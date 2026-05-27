"""
Hermes Agent Server
Runs on :7777, streams chat to Operator OS dashboard on :3737
Writes sessions to ~/agent-os/sessions/hermes.jsonl
"""

import os, json, asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────

AGENT_OS_HOME = Path(os.environ.get("AGENT_OS_HOME", Path.home() / "agent-os"))
SESSIONS_DIR  = AGENT_OS_HOME / "sessions"
VAULT_DIR     = AGENT_OS_HOME / "vault"
SCRATCH_DIR   = AGENT_OS_HOME / "workspace" / "scratch"

# "claude" or "openai"
PROVIDER      = os.environ.get("AI_PROVIDER", "claude").lower()
CLAUDE_MODEL  = os.environ.get("CLAUDE_MODEL", "claude-opus-4-7-20251101")
OPENAI_MODEL  = os.environ.get("OPENAI_MODEL", "gpt-4o")

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_KEY    = os.environ.get("OPENAI_API_KEY", "")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Hermes Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3737", "http://127.0.0.1:3737"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# ── Filesystem helpers ────────────────────────────────────────────────────────

def ensure_dirs():
    for d in [SESSIONS_DIR, VAULT_DIR, SCRATCH_DIR]:
        d.mkdir(parents=True, exist_ok=True)

def session_file(session_id: str) -> Path:
    return SESSIONS_DIR / "hermes.jsonl"

def load_session(session_id: str) -> list[dict]:
    f = session_file(session_id)
    if not f.exists():
        return []
    messages = []
    for line in f.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
            if entry.get("session_id") == session_id:
                messages.append({"role": entry["role"], "content": entry["content"]})
        except Exception:
            pass
    return messages

def append_to_session(session_id: str, role: str, content: str):
    f = session_file(session_id)
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "role": role,
        "content": content,
        "session_id": session_id,
    }
    with open(f, "a") as fh:
        fh.write(json.dumps(entry) + "\n")

def load_vault_context() -> str:
    if not VAULT_DIR.exists():
        return ""
    snippets = []
    for md in sorted(VAULT_DIR.glob("*.md"))[:10]:
        text = md.read_text(errors="ignore")
        preview = text[:200].replace("\n", " ")
        snippets.append(f"[{md.stem}]: {preview}")
    if not snippets:
        return ""
    return "Shared memory from vault:\n" + "\n".join(snippets)

def maybe_save_vault(message: str, reply: str, session_id: str):
    lower = message.lower()
    if "remember" in lower or "save to vault" in lower:
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        slug = message[:40].strip().replace(" ", "-").replace("/", "-")
        fname = VAULT_DIR / f"{ts}_{slug}.md"
        fname.write_text(f"# {message}\n\n{reply}\n")

# ── Streaming helpers ─────────────────────────────────────────────────────────

async def stream_claude(messages: list[dict], system: str) -> AsyncGenerator[str, None]:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    with client.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=system or "You are Hermes, a helpful AI agent.",
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
            await asyncio.sleep(0)

async def stream_openai(messages: list[dict], system: str) -> AsyncGenerator[str, None]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_KEY)
    full_messages = [{"role": "system", "content": system or "You are Hermes, a helpful AI agent."}] + messages
    async with await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=full_messages,
        stream=True,
    ) as stream:
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

# ── SSE generator ─────────────────────────────────────────────────────────────

async def sse_stream(request: ChatRequest) -> AsyncGenerator[str, None]:
    ensure_dirs()

    vault_ctx  = load_vault_context()
    history    = load_session(request.session_id)
    system_msg = f"You are Hermes, a helpful AI agent.\n\n{vault_ctx}".strip()

    history.append({"role": "user", "content": request.message})
    append_to_session(request.session_id, "user", request.message)

    full_reply = ""

    try:
        streamer = (
            stream_claude(history, system_msg)
            if PROVIDER == "claude"
            else stream_openai(history, system_msg)
        )

        async for token in streamer:
            full_reply += token
            payload = json.dumps({"content": token})
            yield f"event: token\ndata: {payload}\n\n"

    except Exception as e:
        err = json.dumps({"error": str(e)})
        yield f"event: error\ndata: {err}\n\n"
        return

    append_to_session(request.session_id, "assistant", full_reply)
    maybe_save_vault(request.message, full_reply, request.session_id)

    done = json.dumps({"session_id": request.session_id})
    yield f"event: done\ndata: {done}\n\n"

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "agent": "hermes",
        "provider": PROVIDER,
        "model": CLAUDE_MODEL if PROVIDER == "claude" else OPENAI_MODEL,
    }

@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")
    return StreamingResponse(
        sse_stream(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@app.get("/history/{session_id}")
def history(session_id: str):
    return load_session(session_id)

@app.get("/capabilities")
def capabilities():
    return {
        "agent": "hermes",
        "provider": PROVIDER,
        "tools": ["chat", "vault_save", "session_history"],
        "workspace_writes": [
            "sessions/hermes.jsonl",
            "vault/*.md",
        ],
    }

# ── Entry ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=7777, reload=False)
