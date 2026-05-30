#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# init.sh — Scaffold the ~/agent-os directory tree and seed config/agents.json
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

AGENT_OS_HOME="${AGENT_OS_HOME:-$HOME/agent-os}"

echo "🚀  Initializing Operator OS filesystem at: $AGENT_OS_HOME"

dirs=(
  "$AGENT_OS_HOME/workspace/studio/images"
  "$AGENT_OS_HOME/workspace/studio/videos"
  "$AGENT_OS_HOME/workspace/studio/voice"
  "$AGENT_OS_HOME/workspace/apps"
  "$AGENT_OS_HOME/workspace/main"
  "$AGENT_OS_HOME/workspace/julian"
  "$AGENT_OS_HOME/workspace/marketing"
  "$AGENT_OS_HOME/workspace/skills"
  "$AGENT_OS_HOME/workspace/goal-mode"
  "$AGENT_OS_HOME/workspace/sandbox"
  "$AGENT_OS_HOME/workspace/downloads"
  "$AGENT_OS_HOME/workspace/pastes"
  "$AGENT_OS_HOME/workspace/scratch"
  "$AGENT_OS_HOME/vault"
  "$AGENT_OS_HOME/sessions"
  "$AGENT_OS_HOME/config"
)

for d in "${dirs[@]}"; do
  mkdir -p "$d"
  echo "  ✓  $d"
done

AGENTS_FILE="$AGENT_OS_HOME/config/agents.json"
if [ ! -f "$AGENTS_FILE" ]; then
  cat > "$AGENTS_FILE" <<'JSON'
[
  {
    "id": "hermes",
    "name": "Hermes",
    "url": "http://localhost:7777",
    "chat_endpoint": "/chat",
    "health_endpoint": "/health",
    "color": "#8B5CF6"
  }
]
JSON
  echo "  ✓  $AGENTS_FILE  (seeded with Hermes)"
else
  echo "  ↩  $AGENTS_FILE  (already exists, skipped)"
fi

SCRATCH="$AGENT_OS_HOME/workspace/scratch/welcome.md"
if [ ! -f "$SCRATCH" ]; then
  cat > "$SCRATCH" <<'MD'
# Welcome to Operator OS

This is your scratch space. Agents write here automatically.

## Buckets (13 total)
- Studio: Images, Videos, Voice
- Workspace: Apps, Main, Julian, Marketing, Skills
- Agent: Goal Mode, Sandbox, Downloads, Pastes, Scratch

## Vault
Store Obsidian-style memory in ~/agent-os/vault/*.md
Every agent reads this as context on each chat turn.
MD
  echo "  ✓  $SCRATCH"
fi

echo ""
echo "✅  Scaffold complete — 13 buckets ready."
echo ""
echo "Next: cd operator-os && npm install && npm run dev -- --port 3737"
