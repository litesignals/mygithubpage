import { readFileText, writeFileText, exists } from "./filesystem";
import type { Agent } from "./types";

const REGISTRY_PATH = "config/agents.json";

const DEFAULT_REGISTRY: Agent[] = [
  {
    id: "hermes",
    name: "Hermes",
    // Internal VPS address — no basic-auth proxy in the way
    url: "http://127.0.0.1:9119",
    chat_endpoint: "/v1/chat/completions",
    health_endpoint: "/health",
    color: "#8B5CF6",
    model: "deepseek-v4-flash",
  },
];

export async function readAgents(): Promise<Agent[]> {
  if (!exists(REGISTRY_PATH)) {
    return DEFAULT_REGISTRY;
  }
  try {
    const raw = await readFileText(REGISTRY_PATH);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("agents.json must be an array");
    return parsed as Agent[];
  } catch (err) {
    console.error("[agentRegistry] Failed to parse agents.json:", err);
    return DEFAULT_REGISTRY;
  }
}

export async function writeAgents(agents: Agent[]): Promise<void> {
  await writeFileText(REGISTRY_PATH, JSON.stringify(agents, null, 2));
}

export async function upsertAgent(agent: Agent): Promise<Agent[]> {
  const agents = await readAgents();
  const idx = agents.findIndex((a) => a.id === agent.id);
  if (idx >= 0) {
    agents[idx] = agent;
  } else {
    agents.push(agent);
  }
  await writeAgents(agents);
  return agents;
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  const agents = await readAgents();
  return agents.find((a) => a.id === id);
}
