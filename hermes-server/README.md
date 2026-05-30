# Hermes Agent Server

FastAPI agent that connects to the Operator OS dashboard on port 3737.  
Streams chat via SSE, persists sessions to `~/agent-os/sessions/hermes.jsonl`, and reads vault memory on every turn.

## Setup

```bash
# 1. Install deps
pip install -r requirements.txt

# 2. Configure API keys
cp .env.example .env
nano .env          # Add ANTHROPIC_API_KEY and/or OPENAI_API_KEY

# 3. Run (foreground)
python main.py

# 4. Or with PM2 (background, auto-restart)
pm2 start 'python main.py' --name hermes
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/chat` | SSE streaming chat |
| GET | `/history/{session_id}` | Session history |
| GET | `/capabilities` | Agent capabilities |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `claude` | `claude` or `openai` |
| `ANTHROPIC_API_KEY` | – | Required for Claude |
| `OPENAI_API_KEY` | – | Required for OpenAI |
| `CLAUDE_MODEL` | `claude-opus-4-7-20251101` | Claude model ID |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model ID |
| `AGENT_OS_HOME` | `~/agent-os` | Filesystem root |

## Vault Memory

Any `.md` file in `~/agent-os/vault/` is loaded as context on every chat turn (up to 10 files, 200 chars each).

To save something to vault, include **"remember"** or **"save to vault"** in your message — Hermes will auto-save the exchange.
