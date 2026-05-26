import { NextRequest, NextResponse } from "next/server";
import { listDir, statFile } from "@/lib/filesystem";
import path from "path";
import type { WorkspaceBucket, WorkspaceFile } from "@/lib/types";

export const dynamic = "force-dynamic";

const BUCKET_DIRS: Record<WorkspaceBucket, string> = {
  images: "workspace/studio/images",
  videos: "workspace/studio/videos",
  apps: "workspace/apps",
  scratch: "workspace/scratch",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get("bucket") as WorkspaceBucket | null;

  const bucketsToScan: WorkspaceBucket[] = bucket
    ? [bucket]
    : (Object.keys(BUCKET_DIRS) as WorkspaceBucket[]);

  const files: WorkspaceFile[] = [];

  for (const b of bucketsToScan) {
    const dir = BUCKET_DIRS[b];
    const entries = await listDir(dir);

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const relPath = path.posix.join(dir, entry.name);
      try {
        const stat = await statFile(relPath);
        files.push({
          name: entry.name,
          path: relPath,
          bucket: b,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
          ext: path.extname(entry.name).toLowerCase().replace(".", ""),
        });
      } catch {
        // skip unreadable files
      }
    }
  }

  // Sort newest first
  files.sort(
    (a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
  );

  return NextResponse.json(files);
}
