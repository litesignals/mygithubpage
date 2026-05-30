import { NextRequest, NextResponse } from "next/server";
import { listDir, statFile } from "@/lib/filesystem";
import path from "path";
import type { WorkspaceBucket, WorkspaceFile } from "@/lib/types";
import { BUCKET_DEFS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get("bucket") as WorkspaceBucket | null;

  const defs = bucket
    ? BUCKET_DEFS.filter((b) => b.id === bucket)
    : BUCKET_DEFS;

  const files: WorkspaceFile[] = [];

  for (const def of defs) {
    const entries = await listDir(def.path);

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const relPath = path.posix.join(def.path, entry.name);
      try {
        const stat = await statFile(relPath);
        files.push({
          name: entry.name,
          path: relPath,
          bucket: def.id,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
          ext: path.extname(entry.name).toLowerCase().replace(".", ""),
        });
      } catch {
        // skip unreadable
      }
    }
  }

  files.sort(
    (a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
  );

  return NextResponse.json(files);
}
