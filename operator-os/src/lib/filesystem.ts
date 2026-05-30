import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// ─── Root resolution ─────────────────────────────────────────────────────────

/** Returns the agent-os root, honouring AGENT_OS_HOME env override. */
export function getAgentOsRoot(): string {
  if (process.env.AGENT_OS_HOME) {
    return path.resolve(process.env.AGENT_OS_HOME);
  }
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "/home/user";
  return path.join(home, "agent-os");
}

/** Resolve a sub-path under agent-os root, preventing path-traversal. */
export function safeResolve(...parts: string[]): string {
  const root = getAgentOsRoot();
  const resolved = path.resolve(root, ...parts);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Path traversal detected: ${resolved}`);
  }
  return resolved;
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

export async function readFileText(relPath: string): Promise<string> {
  const abs = safeResolve(relPath);
  return fs.readFile(abs, "utf8");
}

export async function readFileBinary(relPath: string): Promise<Buffer> {
  const abs = safeResolve(relPath);
  return fs.readFile(abs);
}

export async function writeFileText(
  relPath: string,
  content: string
): Promise<void> {
  const abs = safeResolve(relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

export async function listDir(
  relPath: string
): Promise<import("fs").Dirent[]> {
  const abs = safeResolve(relPath);
  if (!existsSync(abs)) return [];
  return fs.readdir(abs, { withFileTypes: true });
}

export async function statFile(relPath: string) {
  const abs = safeResolve(relPath);
  return fs.stat(abs);
}

export function exists(relPath: string): boolean {
  try {
    const abs = safeResolve(relPath);
    return existsSync(abs);
  } catch {
    return false;
  }
}
