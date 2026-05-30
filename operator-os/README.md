# Operator OS

> A localhost Mission Control dashboard for orchestrating multiple AI agents.  
> Built with Next.js 14 · TypeScript · Tailwind · shadcn/ui · Runs on **http://localhost:3737**

---

## ✨ Features

| Tab | What it does |
|-----|-------------|
| **Chat** | Full SSE-streamed chat with any registered agent, persisted session history |
| **Studio** | Send generate-image / generate-video / generate-voice prompts to the active agent and preview output inline |
| **Workspace** | Browse 4 file buckets (Images, Videos, Apps, Scratch) with live file preview — HTML in sandboxed iframe, video/audio with native controls, code syntax-highlighted |
| **Control Room** | Per-agent health card — online/offline status, ping latency, last 50 session messages, cron job listing |

---

## 🚀 Install & Run

### 1. Scaffold the filesystem

```bash
chmod +x bin/init.sh bin/doctor.sh
./bin/init.sh
```

This creates `~/agent-os/` with the correct directory tree and seeds
`~/agent-os/config/agents.json` with a default Hermes agent.

### 2. Install dependencies

```bash
cd operator-os    # if not already there
npm install
```

### 3. Start the dev server

```bash
npm run dev -- --port 3737
```

Open → **http://localhost:3737**

---

## 🔧 Configuration

### Environment variables

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_OS_HOME` | `~/agent-os` | Override the root for all filesystem reads |

### Filesystem layout (read-only contract)

```
~/agent-os/
  workspace/apps/            .html files → Workspace → Apps bucket
  workspace/studio/images/   .png/.jpg   → Workspace → Images bucket
  workspace/studio/videos/   .mp4/.webm  → Workspace → Videos bucket
  workspace/studio/voice/    .mp3/.wav   → (audio preview in Workspace)
  workspace/scratch/         .md/.txt/.js/.py → Workspace → Scratch
  workspace/skills/          .yaml/.json playbooks
  vault/                     .md files (Obsidian)
  sessions/<agent-id>.jsonl  chat history per agent
  config/agents.json         agent registry
```

---

## ➕ Add an Agent

### Via the UI

1. Click **"+ Add agent"** at the bottom of the left rail
2. Fill in Name, Base URL, and (optionally) chat/health endpoints + color
3. Click **Add Agent** — it writes to `config/agents.json` immediately

### Via agents.json directly

Edit `~/agent-os/config/agents.json`:

```json
[
  {
    "id": "hermes",
    "name": "Hermes",
    "url": "http://localhost:7777",
    "chat_endpoint": "/chat",
    "health_endpoint": "/health",
    "color": "#8B5CF6"
  },
  {
    "id": "atlas",
    "name": "Atlas",
    "url": "http://localhost:8888",
    "chat_endpoint": "/v1/chat",
    "health_endpoint": "/ping",
    "color": "#10B981"
  }
]
```

The sidebar reloads every 15 seconds, or immediately on "Add Agent".

### Agent API contract

Your agent must expose:

| Endpoint | Method | Notes |
|----------|--------|-------|
| `<health_endpoint>` | GET | Return HTTP 200 when healthy |
| `<chat_endpoint>` | POST | Accepts `{message, session_id}`, returns SSE or JSON |

SSE format (preferred):
```
event: token
data: {"content": "Hello"}

event: done
data: {"session_id": "..."}
```

Plain JSON also works — the proxy extracts `.content`, `.message`, or `.response`.

---

## 🩺 Health Check

```bash
./bin/doctor.sh
```

Verifies:
1. All `~/agent-os/*` directories exist
2. `config/agents.json` parses as a valid array
3. Each registered agent responds to its `/health` endpoint
4. `node` + `npm` are available
5. `node_modules` is installed

---

## 🐛 Troubleshooting

| Symptom | Fix |
|---------|-----|
| `AGENT_OS_HOME` not found | Run `./bin/init.sh` |
| Agent shows red dot | Make sure the agent is running at the configured URL |
| Workspace shows no files | Place files in `~/agent-os/workspace/...` matching the bucket paths |
| Port 3737 in use | Change with `npm run dev -- --port <other>` |
| Chat returns empty stream | Check agent's `chat_endpoint` — ensure it accepts POST `{message, session_id}` |
| `next.config.ts` errors | Ensure Node ≥ 18 (`node --version`) |

---

## 🏗 Architecture

```
Browser → Next.js (localhost:3737)
              │
              ├── /api/agents          reads/writes ~/agent-os/config/agents.json
              ├── /api/chat/[agent]    SSE proxy → agent's chat endpoint
              ├── /api/health/[agent]  pings agent's health endpoint (5s timeout)
              ├── /api/sessions/[agent] reads ~/agent-os/sessions/<id>.jsonl
              └── /api/workspace/*    safe-reads files under ~/agent-os/workspace/
```

All filesystem access is **server-side only** (`src/lib/filesystem.ts` enforces
a path-traversal jail under `AGENT_OS_HOME`).

File preview iframes use `sandbox="allow-scripts allow-same-origin"` to prevent
top-level navigation.

---

## 📜 License

MIT
