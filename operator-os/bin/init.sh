#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# init.sh — Scaffold the ~/agent-os directory tree and seed config/agents.json
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

AGENT_OS_HOME="${AGENT_OS_HOME:-$HOME/agent-os}"

echo "🚀  Initializing Operator OS filesystem at: $AGENT_OS_HOME"

# Create directory tree
dirs=(
  "$AGENT_OS_HOME/workspace/apps"
  "$AGENT_OS_HOME/workspace/studio/images"
  "$AGENT_OS_HOME/workspace/studio/videos"
  "$AGENT_OS_HOME/workspace/studio/voice"
  "$AGENT_OS_HOME/workspace/scratch"
  "$AGENT_OS_HOME/workspace/skills"
  "$AGENT_OS_HOME/vault"
  "$AGENT_OS_HOME/sessions"
  "$AGENT_OS_HOME/config"
)

for d in "${dirs[@]}"; do
  mkdir -p "$d"
  echo "  ✓  $d"
done

# Seed config/agents.json only if it doesn't exist
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

# Drop a sample scratch file so the Workspace tab has something to show
SCRATCH="$AGENT_OS_HOME/workspace/scratch/welcome.md"
if [ ! -f "$SCRATCH" ]; then
  cat > "$SCRATCH" <<'MD'
# Welcome to Operator OS

This is a scratch file created by `bin/init.sh`.

## Quick start

1. Make sure an agent is running at the URL configured in `config/agents.json`
2. Open http://localhost:3737
3. Select your agent from the left rail
4. Start chatting!
MD
  echo "  ✓  $SCRATCH  (sample scratch file)"
fi

echo ""
echo "✅  Scaffold complete."
echo ""
echo "Next steps:"
echo "  cd operator-os"
echo "  npm install"
echo "  npm run dev -- --port 3737"
echo ""
echo "Then open → http://localhost:3737"
