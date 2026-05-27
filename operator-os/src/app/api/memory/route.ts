import { NextResponse } from "next/server";
import { listDir, readFileText, exists } from "@/lib/filesystem";
import type { MemoryFile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const files: MemoryFile[] = [];

  if (!exists("vault")) {
    return NextResponse.json(files);
  }

  try {
    const entries = await listDir("vault");
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".md")) continue;

      const relPath = `vault/${entry.name}`;
      try {
        const { default: fs } = await import("fs/promises");
        const { default: path } = await import("path");
        const { getAgentOsRoot } = await import("@/lib/filesystem");
        const abs = path.join(getAgentOsRoot(), relPath);
        const stat = await fs.stat(abs);
        const content = await readFileText(relPath);
        const preview = content.slice(0, 300).replace(/\n+/g, " ").trim();

        files.push({
          name: entry.name,
          path: relPath,
          preview,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
        });
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  files.sort(
    (a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
  );

  return NextResponse.json(files);
}
