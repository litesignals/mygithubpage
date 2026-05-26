#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# doctor.sh — Verify the Operator OS environment is healthy
# ────────────────────────────────────────────────────────────────────────────
set -uo pipefail

AGENT_OS_HOME="${AGENT_OS_HOME:-$HOME/agent-os}"
PASS=0
FAIL=0

green() { printf "\033[0;32m✓\033[0m  %s\n" "$*"; }
red()   { printf "\033[0;31m✗\033[0m  %s\n" "$*"; }
yellow(){ printf "\033[0;33m⚠\033[0m  %s\n" "$*"; }
header(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

check_dir() {
  local path="$1"
  if [ -d "$path" ]; then
    green "dir exists: $path"
    ((PASS++)) || true
  else
    red "MISSING dir: $path"
    ((FAIL++)) || true
  fi
}

header "── Operator OS Doctor ──────────────────────────"
echo "   Root: $AGENT_OS_HOME"

# 1. Directory tree
header "1. Directories"
check_dir "$AGENT_OS_HOME"
check_dir "$AGENT_OS_HOME/workspace/apps"
check_dir "$AGENT_OS_HOME/workspace/studio/images"
check_dir "$AGENT_OS_HOME/workspace/studio/videos"
check_dir "$AGENT_OS_HOME/workspace/studio/voice"
check_dir "$AGENT_OS_HOME/workspace/scratch"
check_dir "$AGENT_OS_HOME/workspace/skills"
check_dir "$AGENT_OS_HOME/vault"
check_dir "$AGENT_OS_HOME/sessions"
check_dir "$AGENT_OS_HOME/config"

# 2. agents.json
header "2. agents.json"
AGENTS_FILE="$AGENT_OS_HOME/config/agents.json"
if [ ! -f "$AGENTS_FILE" ]; then
  red "MISSING: $AGENTS_FILE  (run bin/init.sh)"
  ((FAIL++)) || true
else
  green "file exists: $AGENTS_FILE"
  ((PASS++)) || true

  # Try to parse with python or node
  if command -v python3 &>/dev/null; then
    if python3 -c "import json,sys; data=json.load(open('$AGENTS_FILE')); assert isinstance(data,list), 'not an array'" 2>/dev/null; then
      AGENT_COUNT=$(python3 -c "import json; print(len(json.load(open('$AGENTS_FILE'))))")
      green "JSON valid — $AGENT_COUNT agent(s) registered"
      ((PASS++)) || true
    else
      red "JSON parse error in $AGENTS_FILE"
      ((FAIL++)) || true
    fi
  elif command -v node &>/dev/null; then
    if node -e "const d=require('$AGENTS_FILE');if(!Array.isArray(d))throw new Error('not array');console.log(d.length+' agents')" 2>/dev/null; then
      ((PASS++)) || true
    else
      red "JSON parse error in $AGENTS_FILE"
      ((FAIL++)) || true
    fi
  else
    yellow "No python3 or node found — skipping JSON validation"
  fi
fi

# 3. Ping each registered agent's /health
header "3. Agent Health"
if [ ! -f "$AGENTS_FILE" ]; then
  yellow "Skipping — agents.json missing"
else
  AGENTS_JSON=$(cat "$AGENTS_FILE")

  if command -v python3 &>/dev/null; then
    python3 - <<PYEOF
import json, urllib.request, urllib.error, sys

with open("$AGENTS_FILE") as f:
    agents = json.load(f)

if not agents:
    print("  (no agents to ping)")
    sys.exit(0)

for agent in agents:
    url = agent.get("url","") + agent.get("health_endpoint", "/health")
    try:
        req = urllib.request.urlopen(url, timeout=5)
        code = req.getcode()
        if code == 200:
            print(f"  \033[0;32m✓\033[0m  {agent['name']} ({url}) → HTTP {code}")
        else:
            print(f"  \033[0;33m⚠\033[0m  {agent['name']} ({url}) → HTTP {code}")
    except Exception as e:
        print(f"  \033[0;31m✗\033[0m  {agent['name']} ({url}) → {e}")
PYEOF
  elif command -v curl &>/dev/null && command -v node &>/dev/null; then
    node -e "
const agents = require('$AGENTS_FILE');
const { execSync } = require('child_process');
for (const a of agents) {
  const url = a.url + (a.health_endpoint || '/health');
  try {
    const out = execSync('curl -s -o /dev/null -w \"%{http_code}\" --max-time 5 ' + url, {timeout:6000}).toString();
    const ok = out === '200';
    const sym = ok ? '✓' : '⚠';
    console.log('  ' + sym + '  ' + a.name + ' (' + url + ') → HTTP ' + out);
  } catch(e) {
    console.log('  ✗  ' + a.name + ' (' + url + ') → unreachable');
  }
}
"
  else
    yellow "No python3 or curl+node — skipping health pings"
  fi
fi

# 4. Node & npm
header "4. Node / npm"
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  green "node $NODE_VER"
  ((PASS++)) || true
else
  red "node not found"
  ((FAIL++)) || true
fi
if command -v npm &>/dev/null; then
  NPM_VER=$(npm --version)
  green "npm $NPM_VER"
  ((PASS++)) || true
else
  red "npm not found"
  ((FAIL++)) || true
fi

# 5. node_modules
header "5. Dependencies"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ_DIR="$(dirname "$SCRIPT_DIR")"
if [ -d "$PROJ_DIR/node_modules" ]; then
  green "node_modules present"
  ((PASS++)) || true
else
  red "node_modules missing — run: npm install"
  ((FAIL++)) || true
fi

# Summary
printf "\n────────────────────────────────────────────────\n"
printf "  Passed: \033[0;32m%d\033[0m   Failed: \033[0;31m%d\033[0m\n" "$PASS" "$FAIL"
printf "────────────────────────────────────────────────\n\n"

if [ "$FAIL" -gt 0 ]; then
  echo "Fix the issues above, then re-run bin/doctor.sh"
  exit 1
else
  echo "✅  All checks passed. Start with:"
  echo "     npm run dev -- --port 3737"
  exit 0
fi
