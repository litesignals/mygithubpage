import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { listDir, readFileText, exists } from "@/lib/filesystem";
import type { CronJob } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseCronLine(line: string, source: string): CronJob | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 6) return null;
  const schedule = parts.slice(0, 5).join(" ");
  const command = parts.slice(5).join(" ");
  return { schedule, command, source };
}

export async function GET() {
  const jobs: CronJob[] = [];

  // 1. System crontab
  try {
    const crontab = execSync("crontab -l 2>/dev/null", { timeout: 3000 }).toString();
    for (const line of crontab.split("\n")) {
      const job = parseCronLine(line, "crontab -l");
      if (job) jobs.push(job);
    }
  } catch {
    // no crontab
  }

  // 2. /etc/cron.d/
  try {
    const crond = execSync("ls /etc/cron.d/ 2>/dev/null", { timeout: 3000 }).toString();
    for (const file of crond.split("\n").filter(Boolean)) {
      try {
        const content = execSync(`cat /etc/cron.d/${file} 2>/dev/null`, { timeout: 2000 }).toString();
        for (const line of content.split("\n")) {
          const job = parseCronLine(line, `/etc/cron.d/${file}`);
          if (job) jobs.push(job);
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 3. agent-os/config/ files
  if (exists("config")) {
    try {
      const entries = await listDir("config");
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        try {
          const content = await readFileText(`config/${entry.name}`);
          for (const line of content.split("\n")) {
            if (/\*|@(hourly|daily|weekly|monthly|reboot)/.test(line)) {
              const job = parseCronLine(line, `config/${entry.name}`);
              if (job) jobs.push(job);
            }
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  return NextResponse.json(jobs);
}
